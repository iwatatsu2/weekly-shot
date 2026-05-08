import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const checks = { db: false, line: false };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("ws_users").select("id").limit(1);
    checks.db = !error;
  } catch {
    checks.db = false;
  }

  checks.line = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;

  const allOk = checks.db && checks.line;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      ...checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
