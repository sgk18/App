import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { db } from "@/lib/firebase-admin";
import { createCalendarEvent } from "@/lib/calendar-service";

export async function POST(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const { subject: courseName, title, description, dueDate, priority } = body;
    const teacherId = authResult.user?.uid;

    if (!title || !dueDate || !teacherId) {
      return NextResponse.json({ error: 'Title and Due Date are required' }, { status: 400 });
    }

    const deadlineData: any = {
      title,
      courseName: courseName || '',
      description: description || '',
      dueDate,
      priority: priority || 'medium',
      teacherId,
      reminderSent: {
        sevenDay: false,
        threeDay: false,
        oneDay: false,
        sixHour: false
      },
      calendarSynced: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('deadlines').add(deadlineData);
    
    // Attempt to sync the deadline to their selected Google Calendar
    try {
      const eventData = {
        summary: `[Deadline] ${title}`,
        description: `${courseName ? `Course: ${courseName}\n` : ''}${description || 'No description provided.'}`,
        start: { dateTime: new Date(dueDate).toISOString() },
        end: { dateTime: new Date(new Date(dueDate).getTime() + 60 * 60 * 1000).toISOString() } // 1 hour duration
      };
      
      const eventId = await createCalendarEvent(teacherId, eventData);
      
      // Update the deadline to indicate it was synced
      await docRef.update({ calendarSynced: true, googleEventId: eventId });
      deadlineData.calendarSynced = true;
      deadlineData.googleEventId = eventId;
    } catch (calendarError: any) {
      console.warn(`[Deadlines] Skipping calendar sync for ${teacherId}:`, calendarError.message);
      // We don't fail the deadline creation just because the calendar isn't linked
    }

    return NextResponse.json({
      message: 'Deadline created successfully',
      id: docRef.id,
      ...deadlineData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating deadline:', error);
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 });
  }
}
