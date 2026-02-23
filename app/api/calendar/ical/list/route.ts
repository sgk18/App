import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snapshot = await db.collection('teachers').doc(teacherId).collection('icalFeeds').get();
    const feeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ feeds }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing iCal feeds:", error.message);
    return NextResponse.json({ error: "Failed to list iCal feeds." }, { status: 500 });
  }
}
