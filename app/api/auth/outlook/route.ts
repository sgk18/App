import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/outlook-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");

  if (!teacherId) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
  }

  try {
    const url = await getAuthUrl(teacherId);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[outlook.auth] Error generating auth URL:", error.message);
    return NextResponse.json({ error: "Failed to generate Outlook auth URL" }, { status: 500 });
  }
}
