import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { feedId: string } }
) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const teacherId = authResult.user?.uid;
    if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { feedId } = params;

    await db.collection('teachers').doc(teacherId).collection('icalFeeds').doc(feedId).delete();

    return NextResponse.json({ message: "iCal feed removed." }, { status: 200 });
  } catch (error: any) {
    console.error("Error removing iCal feed:", error.message);
    return NextResponse.json({ error: "Failed to remove iCal feed." }, { status: 500 });
  }
}
