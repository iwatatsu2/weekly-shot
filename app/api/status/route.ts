import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getLineProfile(
  accessToken: string
): Promise<{ userId: string } | null> {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getLineProfile(token);
  if (!profile) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { action } = (await req.json()) as {
    action: "pause" | "resume" | "withdraw";
  };

  const statusMap = {
    pause: "paused",
    resume: "active",
    withdraw: "withdrawn",
  } as const;

  const newStatus = statusMap[action];
  if (!newStatus) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("ws_users")
    .update({ status: newStatus })
    .eq("line_user_id", profile.userId);

  // 退会時はキューもキャンセル
  if (action === "withdraw") {
    const { data: user } = await supabase
      .from("ws_users")
      .select("id")
      .eq("line_user_id", profile.userId)
      .single();

    if (user) {
      await supabase
        .from("ws_notification_queue")
        .update({ status: "cancelled" })
        .eq("user_id", user.id)
        .eq("status", "queued");
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
