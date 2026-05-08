import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function verifyLiffToken(
  accessToken: string
): Promise<string | null> {
  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: accessToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // LIFFトークンのclient_idがLINEログインチャネルIDと一致するか確認
  if (data.client_id === "2010011578") return accessToken;
  // Messaging APIチャネルIDでも許可
  if (data.client_id === "2010011486") return accessToken;
  return data.client_id ? accessToken : null;
}

async function getLineProfile(
  accessToken: string
): Promise<{ userId: string; displayName: string } | null> {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function getNextInjectionDate(weekday: number, timeOfDay: string): Date {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const currentDay = jstNow.getDay();
  let daysUntil = weekday - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    const [h, m] = timeOfDay.split(":").map(Number);
    if (jstNow.getHours() > h || (jstNow.getHours() === h && jstNow.getMinutes() >= m)) {
      daysUntil = 7;
    }
  }
  const next = new Date(jstNow);
  next.setDate(next.getDate() + daysUntil);
  const [h, m] = timeOfDay.split(":").map(Number);
  next.setHours(h, m, 0, 0);
  return next;
}

export async function GET(req: NextRequest) {
  const lineUserId = req.headers.get("x-line-userid");
  if (!lineUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: user } = await supabase
    .from("ws_users")
    .select("id, status")
    .eq("line_user_id", lineUserId)
    .single();

  if (!user) {
    return NextResponse.json({ schedule: null, status: "new" });
  }

  const { data: schedule } = await supabase
    .from("ws_schedules")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  return NextResponse.json({ schedule: schedule || null, status: user.status });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { weekday, time_of_day, medication, line_user_id, display_name } = body as {
    weekday: number;
    time_of_day: string;
    medication: string;
    line_user_id: string;
    display_name: string;
  };

  if (!line_user_id) {
    return NextResponse.json({ error: "Missing user info" }, { status: 400 });
  }

  if (weekday < 0 || weekday > 6 || !time_of_day) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Upsert user
  const { data: user } = await supabase
    .from("ws_users")
    .upsert(
      {
        line_user_id,
        display_name: display_name || "unknown",
        status: "active",
      },
      { onConflict: "line_user_id" }
    )
    .select("id")
    .single();

  if (!user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Deactivate existing schedules
  await supabase
    .from("ws_schedules")
    .update({ active: false })
    .eq("user_id", user.id);

  // Insert new schedule
  await supabase.from("ws_schedules").insert({
    user_id: user.id,
    weekday,
    time_of_day,
    medication: medication || "unspecified",
    active: true,
  });

  const nextInjection = getNextInjectionDate(weekday, time_of_day);

  return NextResponse.json({
    ok: true,
    next_injection: nextInjection.toISOString(),
  });
}
