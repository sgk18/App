import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { db } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = params;
    const deadlineRef = db.collection('deadlines').doc(id);
    
    const doc = await deadlineRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }
    
    if (doc.data()?.teacherId !== authResult.user?.uid) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deadlineRef.delete();
    
    return NextResponse.json({ message: 'Deadline deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json({ error: 'Failed to delete deadline' }, { status: 500 });
  }
}
