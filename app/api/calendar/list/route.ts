import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { fetchCalendars } from '@/lib/calendar-service';

export async function GET(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const calendars = await fetchCalendars(teacherId);
    return NextResponse.json({ calendars }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching calendars:", error.message);
    return NextResponse.json({ error: "Failed to load calendars. Your Google Calendar might need refreshing." }, { status: 500 });
  }
}
