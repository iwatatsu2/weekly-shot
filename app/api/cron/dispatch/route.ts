import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lineClient } from "@/lib/line";
import { messages } from "@/lib/messages";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Vercel Cron認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const currentWeekday = jstNow.getDay();
  const currentHour = jstNow.getHours();

  let processed = 0;
  let errors = 0;

  // TEMP: 古いログ・キューをクリア（デバッグ用、後で削除）
  await supabase.from("ws_notification_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("ws_injection_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 1. 注射ログ・通知キュー生成（当日通知）
  await generateNotifications(supabase, jstNow, currentWeekday, currentHour);

  // 2. キュー送信: send_at <= now かつ status = 'queued'
  const { data: queue } = await supabase
    .from("ws_notification_queue")
    .select("*, ws_users!inner(line_user_id, status, push_enabled, last_active_at)")
    .eq("status", "queued")
    .lte("send_at", now.toISOString())
    .limit(100);

  if (queue) {
    for (const item of queue) {
      try {
        const user = item.ws_users as { line_user_id: string; status: string; push_enabled: boolean; last_active_at: string | null };

        // ユーザーが非アクティブ or Push OFF → スキップ
        if (user.status !== "active" || user.push_enabled === false) {
          await supabase
            .from("ws_notification_queue")
            .update({ status: "cancelled" })
            .eq("id", item.id);
          continue;
        }

        // スマートスキップ: 今日既にメッセージを送ってきたユーザーはPush不要
        if (user.last_active_at) {
          const lastActive = new Date(user.last_active_at);
          const todayStart = new Date(jstNow);
          todayStart.setHours(0, 0, 0, 0);
          if (lastActive >= todayStart) {
            await supabase
              .from("ws_notification_queue")
              .update({ status: "cancelled" })
              .eq("id", item.id);
            continue;
          }
        }

        const message = buildMessage(item.message_type, item.log_id, supabase);
        const messageText = await message;

        await lineClient.pushMessage({
          to: user.line_user_id,
          messages: [messageText],
        });

        await supabase
          .from("ws_notification_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", item.id);

        processed++;
      } catch (err) {
        console.error("Push error:", err);
        await supabase
          .from("ws_notification_queue")
          .update({ status: "failed" })
          .eq("id", item.id);
        errors++;
      }
    }
  }

  // 3. missed判定: scheduled_at + 24h < now かつ status = 'pending'
  const missedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: missedLogs } = await supabase
    .from("ws_injection_logs")
    .select("id, user_id")
    .eq("status", "pending")
    .lt("scheduled_at", missedCutoff);

  if (missedLogs) {
    for (const log of missedLogs) {
      await supabase
        .from("ws_injection_logs")
        .update({ status: "missed" })
        .eq("id", log.id);

      // missed通知はPush節約のため送信しない（ログ更新のみ）

      // follow_upキャンセル
      await supabase
        .from("ws_notification_queue")
        .update({ status: "cancelled" })
        .eq("log_id", log.id)
        .eq("status", "queued");
    }
  }

  // デバッグ: スケジュール一覧
  const { data: debugSchedules } = await supabase
    .from("ws_schedules")
    .select("weekday, time_of_day, active, ws_users!inner(status)")
    .eq("active", true);

  // デバッグ: キュー状態（全status）
  const { data: debugQueue } = await supabase
    .from("ws_notification_queue")
    .select("status, message_type, send_at, sent_at, created_at, user_id, log_id")
    .order("created_at", { ascending: false })
    .limit(10);

  // デバッグ: ログ状態
  const { data: debugLogs } = await supabase
    .from("ws_injection_logs")
    .select("status, scheduled_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    missed: missedLogs?.length ?? 0,
    timestamp: now.toISOString(),
    debug: {
      jstWeekday: currentWeekday,
      jstHour: currentHour,
      schedules: debugSchedules,
      queue: debugQueue,
      logs: debugLogs,
      insertErrors: debugErrors,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let debugErrors: string[] = [];

async function generateNotifications(supabase: any, jstNow: Date, currentWeekday: number, _currentHour: number) {
  // アクティブなスケジュールを持つユーザーを取得
  const { data: schedules } = await supabase
    .from("ws_schedules")
    .select("*, ws_users!inner(id, line_user_id, status)")
    .eq("active", true)
    .eq("ws_users.status", "active");

  if (!schedules) return;

  for (const schedule of schedules) {
    const user = schedule.ws_users as { id: string; line_user_id: string };
    const injectionWeekday = schedule.weekday;
    const [injH] = schedule.time_of_day.split(":").map(Number);
    const injM = parseInt(schedule.time_of_day.split(":")[1]) || 0;

    // 当日通知: 曜日一致 & 設定時刻の「時」が現在時と一致
    if (currentWeekday === injectionWeekday && _currentHour === injH) {
      await ensureLogAndQueue(
        supabase, user.id, jstNow, injH, injM, "on_day", jstNow
      );
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureLogAndQueue(supabase: any, userId: string, date: Date, hour: number, minute: number, messageType: string, jstNow: Date) {
  // scheduled_atを生成（JST基準）
  const scheduledAt = new Date(date);
  scheduledAt.setHours(hour, minute, 0, 0);
  // JSTをUTCに変換
  const scheduledAtUtc = new Date(scheduledAt.getTime() - 9 * 60 * 60 * 1000);

  // 既にこの予定のログがあるか確認（±1時間で厳密にマッチ）
  const startRange = new Date(scheduledAtUtc.getTime() - 60 * 60 * 1000);
  const endRange = new Date(scheduledAtUtc.getTime() + 60 * 60 * 1000);

  const { data: existingLog } = await supabase
    .from("ws_injection_logs")
    .select("id")
    .eq("user_id", userId)
    .gte("scheduled_at", startRange.toISOString())
    .lte("scheduled_at", endRange.toISOString())
    .limit(1);

  let logId: string;

  if (existingLog && existingLog.length > 0) {
    logId = existingLog[0].id;
  } else {
    const { data: newLog } = await supabase
      .from("ws_injection_logs")
      .insert({
        user_id: userId,
        scheduled_at: scheduledAtUtc.toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (!newLog) return;
    logId = newLog.id;
  }

  // 既にこのタイプの通知がキューにあるか確認
  const { data: existingQueue } = await supabase
    .from("ws_notification_queue")
    .select("id")
    .eq("log_id", logId)
    .eq("message_type", messageType)
    .limit(1);

  if (existingQueue && existingQueue.length > 0) return;

  // キューに追加（即時送信: send_at = now）
  const sendAt = new Date(jstNow.getTime() - 9 * 60 * 60 * 1000); // UTC
  const { data: insertedQueue, error: queueError } = await supabase.from("ws_notification_queue").insert({
    user_id: userId,
    log_id: logId,
    send_at: sendAt.toISOString(),
    message_type: messageType,
    status: "queued",
  }).select("id").single();
  debugErrors.push("Queue insert result: " + JSON.stringify({ insertedQueue, queueError, userId, logId }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildMessage(messageType: string, logId: string, supabase: any) {
  // 当日通知
  return {
    type: "template" as const,
    altText: "今日はGLP-1注射の日です",
    template: {
      type: "confirm" as const,
      text: messages.onDay(),
      actions: [
        {
          type: "postback" as const,
          label: "打ちました",
          data: `action=confirm_injection&log_id=${logId}`,
        },
        {
          type: "postback" as const,
          label: "あとで",
          data: `action=defer&log_id=${logId}`,
        },
      ],
    },
  };
}
