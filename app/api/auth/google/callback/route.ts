import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';
import { db, admin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const teacherId = searchParams.get('state');

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: "Authorization code is required." }, { status: 400 });
  }

  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    return NextResponse.json({ error: "Matching state (teacherId) is required." }, { status: 400 });
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save to Firestore using Admin SDK
    await db.collection('teachers').doc(teacherId).set({
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token, // Guaranteed by prompt: 'consent'
      googleTokenExpiry: tokens.expiry_date,
      calendarConnected: true,
      calendarConnectedAt: admin.firestore.FieldValue.serverTimestamp() // Track insertion time
    }, { merge: true });

    // Automatically resolve relative path for dynamic environment redirection
    const url = req.nextUrl.clone();
    url.pathname = '/settings';
    url.search = '?calendar_connected=true';
    
    return NextResponse.redirect(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Failed to link Google OAuth:', error.message);
    
    const url = req.nextUrl.clone();
    url.pathname = '/settings';
    url.search = '?calendar_error=true';
    
    return NextResponse.redirect(url);
  }
}
