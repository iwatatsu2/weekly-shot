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

  // 1. 注射ログ・通知キュー生成（当日通知）
  await generateNotifications(supabase, jstNow, currentWeekday, currentHour);

  // 2. キュー送信: send_at <= now かつ status = 'queued'
  const { data: queue } = await supabase
    .from("ws_notification_queue")
    .select("*")
    .eq("status", "queued")
    .lte("send_at", now.toISOString())
    .limit(100);

  if (queue) {
    for (const item of queue) {
      try {
        const { data: user } = await supabase
          .from("ws_users")
          .select("line_user_id, status, push_enabled")
          .eq("id", item.user_id)
          .single();

        if (!user || user.status !== "active" || user.push_enabled === false) {
          await supabase
            .from("ws_notification_queue")
            .update({ status: "cancelled" })
            .eq("id", item.id);
          continue;
        }

        const messageText = await buildMessage(item.message_type, item.log_id, supabase);

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

      await supabase
        .from("ws_notification_queue")
        .update({ status: "cancelled" })
        .eq("log_id", log.id)
        .eq("status", "queued");
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    missed: missedLogs?.length ?? 0,
    timestamp: now.toISOString(),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateNotifications(supabase: any, jstNow: Date, currentWeekday: number, currentHour: number) {
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

    if (currentWeekday === injectionWeekday && currentHour === injH) {
      await ensureLogAndQueue(supabase, user.id, jstNow, injH, injM, "on_day", jstNow);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureLogAndQueue(supabase: any, userId: string, date: Date, hour: number, minute: number, messageType: string, jstNow: Date) {
  const scheduledAt = new Date(date);
  scheduledAt.setHours(hour, minute, 0, 0);
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
  const sendAt = new Date(jstNow.getTime() - 9 * 60 * 60 * 1000);
  await supabase.from("ws_notification_queue").insert({
    user_id: userId,
    log_id: logId,
    send_at: sendAt.toISOString(),
    message_type: messageType,
    status: "queued",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildMessage(messageType: string, logId: string, supabase: any) {
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
