import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { fetchCalendarEvents, syncExternalEvents } from '@/lib/calendar-service';

export async function GET(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Trigger sync in background (don't await for faster response)
    syncExternalEvents(teacherId).catch(err => console.error("Background sync failed:", err.message));

    const events = await fetchCalendarEvents(teacherId);
    return NextResponse.json({ events }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching upcoming events:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

