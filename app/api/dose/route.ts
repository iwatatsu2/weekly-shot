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
    return NextResponse.json({ changes: [] });
  }

  const { data: changes } = await supabase
    .from("ws_dose_changes")
    .select("changed_date, medication, dose")
    .eq("user_id", user.id)
    .order("changed_date", { ascending: true });

  return NextResponse.json({ changes: changes || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { line_user_id, changed_date, medication, dose } = body as {
    line_user_id: string;
    changed_date?: string;
    medication: string;
    dose: string;
  };

  if (!line_user_id || !medication || !dose) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

  const date = changed_date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

  const { error } = await supabase
    .from("ws_dose_changes")
    .insert({
      user_id: user.id,
      changed_date: date,
      medication,
      dose,
    });

  if (error) {
    console.error("Dose change error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
