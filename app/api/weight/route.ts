import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const lineUserId = req.headers.get("x-line-userid");
  if (!lineUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("ws_users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!user) {
    return NextResponse.json({ logs: [] });
  }

  const { data: logs } = await supabase
    .from("ws_weight_logs")
    .select("recorded_date, weight, body_fat, memo")
    .eq("user_id", user.id)
    .order("recorded_date", { ascending: true });

  return NextResponse.json({ logs: logs || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { line_user_id, weight, body_fat, recorded_date, memo } = body as {
    line_user_id: string;
    weight: number;
    body_fat?: number;
    recorded_date?: string;
    memo?: string;
  };

  if (!line_user_id || !weight) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (weight < 20 || weight > 300) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("ws_users")
    .select("id")
    .eq("line_user_id", line_user_id)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const date = recorded_date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

  const { error } = await supabase
    .from("ws_weight_logs")
    .upsert(
      {
        user_id: user.id,
        recorded_date: date,
        weight,
        body_fat: body_fat || null,
        memo: memo || null,
      },
      { onConflict: "user_id,recorded_date" }
    );

  if (error) {
    console.error("Weight log error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recorded_date: date });
}
