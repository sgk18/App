import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { sendReminderEmail } from '@/lib/email-service';
import { syncExternalEvents } from '@/lib/calendar-service';

// Calculates the true hours remaining until the deadline
const getHoursRemaining = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60);
};

export async function GET(req: NextRequest) {
  // 1. Secure the endpoint using Vercel's Cron Secret Header
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
  }

  try {
    console.log("Starting hourly deadline reminder assessment...");
    const deadlinesSnapshot = await db.collection('deadlines').get();
    
    // Process deadline email reminders
    const reminderPromises = deadlinesSnapshot.docs.map(async (doc) => {
      const deadline = { id: doc.id, ...doc.data() } as any;
      const hoursRemaining = getHoursRemaining(deadline.dueDate);

      // Skip past deadlines
      if (hoursRemaining < 0) return;

      let reminderToSent = null;

      if (hoursRemaining <= 6 && hoursRemaining > 0 && !deadline.reminderSent?.sixHour) {
        reminderToSent = 'sixHour';
      } else if (hoursRemaining <= 24 && hoursRemaining > 6 && !deadline.reminderSent?.oneDay) {
        reminderToSent = 'oneDay';
      } else if (hoursRemaining <= 72 && hoursRemaining > 24 && !deadline.reminderSent?.threeDay) {
        reminderToSent = 'threeDay';
      } else if (hoursRemaining <= 168 && hoursRemaining > 72 && !deadline.reminderSent?.sevenDay) {
        reminderToSent = 'sevenDay';
      }

      if (reminderToSent) {
        const teacherDoc = await db.collection('teachers').doc(deadline.teacherId).get();
        if (teacherDoc.exists) {
          const teacher = teacherDoc.data() as any;
          
          const emailSent = await sendReminderEmail(
            teacher.email, 
            teacher.name, 
            deadline, 
            reminderToSent
          );

          if (emailSent) {
            const updateField = `reminderSent.${reminderToSent}`;
            await db.collection('deadlines').doc(doc.id).update({
              [updateField]: true
            });
            console.log(`Updated Firestore for deadline ${deadline.title} (${reminderToSent} flag)`);
          }
        }
      }
    });

    await Promise.all(reminderPromises);

    // Process external calendar syncs
    console.log('Running Google Calendar auto-sync assessment...');
    const teachersSnapshot = await db.collection('teachers').where('autoSyncEnabled', '==', true).get();
    const syncPromises = teachersSnapshot.docs.map(doc => syncExternalEvents(doc.id));
    
    await Promise.all(syncPromises);
    console.log(`[Scheduler] Processed external calendar sync for ${syncPromises.length} teachers.`);

    return NextResponse.json({ success: true, message: "Cron jobs executed successfully" }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('CRON execution failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
