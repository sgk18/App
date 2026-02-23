import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';
import { syncExternalEvents } from '@/lib/calendar-service';

export async function POST(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { calendarId } = body;

    if (!calendarId) {
      return NextResponse.json({ error: "No calendarId provided." }, { status: 400 });
    }

    // 1. Save the choice in Firestore
    await db.collection('teachers').doc(teacherId).update({
      linkedCalendarId: calendarId,
      autoSyncEnabled: true // Enable by default when linked
    });

    // 2. Trigger immediate sync
    await syncExternalEvents(teacherId);

    return NextResponse.json({ message: "Calendar successfully linked." }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error linking calendar:", error.message);
    return NextResponse.json({ error: "Failed to link calendar." }, { status: 500 });
  }
}

