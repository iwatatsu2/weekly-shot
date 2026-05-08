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
    .select("height")
    .eq("line_user_id", lineUserId)
    .single();

  return NextResponse.json({ height: user?.height ?? null });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { line_user_id, height } = body as { line_user_id: string; height: number };

  if (!line_user_id || !height || height < 100 || height > 250) {
    return NextResponse.json({ error: "Invalid height (100-250cm)" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("ws_users")
    .update({ height })
    .eq("line_user_id", line_user_id);

  if (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
