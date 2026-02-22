import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { db } from "@/lib/firebase-admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = params;
    const updates = await req.json();
    const deadlineRef = db.collection('deadlines').doc(id);
    
    const doc = await deadlineRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }
    
    if (doc.data()?.teacherId !== authResult.user?.uid) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow updating teacherId
    delete updates.teacherId;
    
    await deadlineRef.update(updates);
    
    return NextResponse.json({ message: 'Deadline updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating deadline:', error);
    return NextResponse.json({ error: 'Failed to update deadline' }, { status: 500 });
  }
}
