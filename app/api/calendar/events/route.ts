import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { fetchCalendarEvents } from '@/lib/calendar-service';

export async function GET(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const events = await fetchCalendarEvents(teacherId);
    return NextResponse.json({ events }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching upcoming events:", error.message);
    // Might not have a calendar linked yet, handle gracefully
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
