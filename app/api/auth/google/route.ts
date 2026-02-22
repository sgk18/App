import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const teacherId = searchParams.get('teacherId');

  // 1. Validate teacherId rigorously
  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    return NextResponse.json({ error: "teacherId is required and must be a valid string." }, { status: 400 });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar' // Scope for Google Calendar reading and writing
  ];

  try {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Ensures a refresh token is returned
      prompt: 'consent', // Forces consent screen to ensure refresh token is provided
      scope: scopes,
      state: teacherId.trim() // Crucial: send teacherId through Google flow so we get it back
    });

    return NextResponse.json({ url: authorizationUrl }, { status: 200 });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    return NextResponse.json({ error: "Failed to generate authorization URL." }, { status: 500 });
  }
}
