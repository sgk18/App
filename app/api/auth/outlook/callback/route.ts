import { NextRequest, NextResponse } from "next/server";
import { acquireTokenByCode } from "@/lib/outlook-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const teacherId = searchParams.get("state");

  if (!code || !teacherId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    await acquireTokenByCode(code, teacherId);
    
    // Redirect back to settings with a success parameter
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/settings?outlook_connected=true`);
  } catch (error: any) {
    console.error("[outlook.auth] Callback error:", error.message);
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/settings?error=outlook_auth_failed`);
  }
}
