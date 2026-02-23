import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { admin, db } from '@/lib/firebase-admin';
import { syncExternalEvents } from '@/lib/calendar-service';

export async function POST(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { icalUrl, label } = await req.json();

    if (!icalUrl) {
      return NextResponse.json({ error: "No iCal URL provided." }, { status: 400 });
    }

    const newFeedId = db.collection('teachers').doc(teacherId).collection('icalFeeds').doc().id;
    const newFeed = {
      id: newFeedId,
      url: icalUrl,
      label: label || "External iCal",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 1. Link the feed
    await db.collection('teachers').doc(teacherId).collection('icalFeeds').doc(newFeedId).set(newFeed);

    // 2. Ensure autoSync is enabled
    await db.collection('teachers').doc(teacherId).update({ autoSyncEnabled: true });

    // 3. Trigger immediate sync
    await syncExternalEvents(teacherId);

    return NextResponse.json({ message: "iCal feed linked successfully.", feed: newFeed }, { status: 200 });
  } catch (error: any) {
    console.error("Error linking iCal:", error.message);
    return NextResponse.json({ error: "Failed to link iCal feed." }, { status: 500 });
  }
}

