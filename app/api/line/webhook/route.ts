import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignature, lineClient } from "@/lib/line";
import { messages } from "@/lib/messages";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");

  // パース
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const events = parsed.events || [];

  // LINE検証リクエスト（eventsが空）
  if (events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // 署名検証（検証リクエスト以外）
  if (!signature || !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("Webhook event error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(event: any) {
  const userId = event.source?.userId;
  if (!userId) return;

  switch (event.type) {
    case "follow":
      await handleFollow(userId, event.replyToken);
      break;
    case "unfollow":
      await handleUnfollow(userId);
      break;
    case "message":
      if (event.message.type === "text") {
        await handleText(userId, event.message.text, event.replyToken);
      }
      break;
    case "postback":
      await handlePostback(userId, event.postback.data, event.replyToken);
      break;
  }
}

async function handleFollow(userId: string, replyToken: string) {
  const supabase = getSupabase();

  // Upsert user (re-follow対応)
  await supabase
    .from("ws_users")
    .upsert(
      { line_user_id: userId, status: "active" },
      { onConflict: "line_user_id" }
    );

  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: "text", text: messages.welcome }],
  });
}

async function handleUnfollow(userId: string) {
  const supabase = getSupabase();
  await supabase
    .from("ws_users")
    .update({ status: "withdrawn" })
    .eq("line_user_id", userId);
}

async function handleText(
  userId: string,
  text: string,
  replyToken: string
) {
  const normalized = text.trim();
  const supabase = getSupabase();

  if (["停止", "一時停止", "ストップ", "stop"].includes(normalized)) {
    await supabase
      .from("ws_users")
      .update({ status: "paused" })
      .eq("line_user_id", userId);

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: messages.paused }],
    });
    return;
  }

  if (["再開", "再開する", "start"].includes(normalized)) {
    await supabase
      .from("ws_users")
      .update({ status: "active" })
      .eq("line_user_id", userId);

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: messages.resumed }],
    });
    return;
  }

  if (["設定", "設定する"].includes(normalized)) {
    const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;
    await lineClient.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: `以下のリンクから設定画面を開いてください:\n${liffUrl}`,
        },
      ],
    });
    return;
  }

  if (["ヘルプ", "help", "使い方"].includes(normalized)) {
    await lineClient.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: `【WeeklyShot 使い方】\n・「設定」→ 注射スケジュールの登録・変更\n・「停止」→ 通知の一時停止\n・「再開」→ 通知の再開\n\n注射日の前日と当日にLINEでお知らせします。`,
        },
      ],
    });
    return;
  }
}

async function handlePostback(
  userId: string,
  data: string,
  replyToken: string
) {
  const params = new URLSearchParams(data);
  const action = params.get("action");
  const logId = params.get("log_id");

  if (!logId) return;

  const supabase = getSupabase();

  if (action === "confirm_injection") {
    // 「打ちました」処理
    const now = new Date().toISOString();
    await supabase
      .from("ws_injection_logs")
      .update({ status: "confirmed", confirmed_at: now })
      .eq("id", logId);

    // 未送信のfollow_upをキャンセル
    await supabase
      .from("ws_notification_queue")
      .update({ status: "cancelled" })
      .eq("log_id", logId)
      .eq("status", "queued");

    // 次回日付を計算
    const { data: log } = await supabase
      .from("ws_injection_logs")
      .select("user_id")
      .eq("id", logId)
      .single();

    let replyText = "お疲れさまでした👏";

    if (log) {
      const { data: schedule } = await supabase
        .from("ws_schedules")
        .select("weekday, time_of_day")
        .eq("user_id", log.user_id)
        .eq("active", true)
        .single();

      if (schedule) {
        const nextDate = getNextWeekDate(schedule.weekday);
        // note誘導は3回に1回
        const { count } = await supabase
          .from("ws_injection_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", log.user_id)
          .eq("status", "confirmed");

        const includeNote = (count ?? 0) % 3 === 0;
        replyText = messages.confirmed(nextDate, schedule.time_of_day, includeNote);
      }
    }

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: replyText }],
    });
  }

  if (action === "defer") {
    // 「あとで」処理 → 2時間後に再通知をキューに追加
    const { data: log } = await supabase
      .from("ws_injection_logs")
      .select("user_id, reminder_count")
      .eq("id", logId)
      .single();

    if (log && log.reminder_count < 3) {
      const sendAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await supabase.from("ws_notification_queue").insert({
        user_id: log.user_id,
        log_id: logId,
        send_at: sendAt,
        message_type: "follow_up",
        status: "queued",
      });

      await supabase
        .from("ws_injection_logs")
        .update({ reminder_count: log.reminder_count + 1 })
        .eq("id", logId);
    }

    await lineClient.replyMessage({
      replyToken,
      messages: [
        { type: "text", text: "わかりました。2時間後にもう一度お知らせします。" },
      ],
    });
  }
}

function getNextWeekDate(weekday: number): Date {
  const now = new Date();
  const jstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const daysUntil = ((weekday - jstNow.getDay() + 7) % 7) || 7;
  const next = new Date(jstNow);
  next.setDate(next.getDate() + daysUntil);
  return next;
}
