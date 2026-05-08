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

  // 署名検証（TODO: 本番運用前に有効化）
  // 現在はChannel Secret検証の問題で無効化中
  // if (signature) {
  //   const isValid = verifySignature(body, signature);
  //   if (!isValid) {
  //     console.error("Signature verification failed");
  //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  //   }
  // }

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

  // スマートスキップ用: 最終アクティブ日時を更新
  const supabaseForActive = getSupabase();
  await supabaseForActive
    .from("ws_users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("line_user_id", userId);

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

  if (["打ちました", "打った", "注射した"].includes(normalized)) {
    // テキストでの注射確認 — 最新のpendingログを確認済みに
    const { data: user } = await supabase
      .from("ws_users")
      .select("id")
      .eq("line_user_id", userId)
      .single();

    if (user) {
      const { data: log } = await supabase
        .from("ws_injection_logs")
        .select("id, user_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .single();

      if (log) {
        const now = new Date().toISOString();
        await supabase
          .from("ws_injection_logs")
          .update({ status: "confirmed", confirmed_at: now })
          .eq("id", log.id);

        await supabase
          .from("ws_notification_queue")
          .update({ status: "cancelled" })
          .eq("log_id", log.id)
          .eq("status", "queued");
      }

      // 次回日付を取得
      const { data: schedule } = await supabase
        .from("ws_schedules")
        .select("weekday, time_of_day")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (schedule) {
        const nextDate = getNextWeekDate(schedule.weekday);
        await lineClient.replyMessage({
          replyToken,
          messages: [{ type: "text", text: messages.confirmed(nextDate, schedule.time_of_day, false) }],
        });
        return;
      }
    }

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "お疲れさまでした👏" }],
    });
    return;
  }

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

if (["通知オフ", "通知OFF"].includes(normalized)) {
    await supabase
      .from("ws_users")
      .update({ push_enabled: false })
      .eq("line_user_id", userId);

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "Push通知をOFFにしました。スマホのカレンダー等でリマインドしてください。\n「通知オン」で再開できます。" }],
    });
    return;
  }

  if (["通知オン", "通知ON"].includes(normalized)) {
    await supabase
      .from("ws_users")
      .update({ push_enabled: true })
      .eq("line_user_id", userId);

    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "Push通知をONにしました。注射日にLINEでお知らせします。" }],
    });
    return;
  }

  if (["設定", "設定する"].includes(normalized)) {
    const liffUrl = "https://liff.line.me/2010011578-BsNXGUao";
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

  if (["体重", "記録", "体重記録"].includes(normalized)) {
    const liffUrl = "https://liff.line.me/2010011578-1vSQw5Gj";
    await lineClient.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: `以下のリンクから体重を記録できます📊\n${liffUrl}`,
        },
      ],
    });
    return;
  }

  if (["LP", "lp", "リンク", "ホームページ", "HP"].includes(normalized)) {
    await lineClient.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: "WeeklyShotのページはこちらです:\nhttps://weekly-shot.vercel.app",
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
          text: `【WeeklyShot 使い方】\n\nトーク画面で以下のキーワードを送信してください:\n\n💉「設定」→ 注射スケジュールの登録・変更\n📊「体重」→ 体重を記録する\n✅「打ちました」→ 注射完了を記録\n⏸「停止」→ 通知の一時停止\n▶️「再開」→ 通知の再開\n🔕「通知オフ」→ Push通知を停止\n🔔「通知オン」→ Push通知を再開\n\n注射日の当日にLINEでお知らせします。\n\n━━━━━━━━━━\n👨‍⚕️ 開発者: Dr.いわたつ（糖尿病・内分泌専門医）\n🏠 HP: https://driwatatsu.readdy.co\n📖 note: https://note.com/dr_iwatatsu\n𝕏 X: https://x.com/KenKyu1019799`,
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
    // 「あとで」処理（Push節約: フォローアップ再通知は廃止、Reply応答のみ）
    await lineClient.replyMessage({
      replyToken,
      messages: [
        { type: "text", text: "わかりました。準備ができたら「打ちました」とメッセージを送ってください。" },
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
