import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const { name, email, department } = body;
    const teacherId = authResult.user?.uid;

    if (!name || !email || !teacherId) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const teacherRef = db.collection('teachers').doc(teacherId);
    
    // Check if teacher already exists
    const doc = await teacherRef.get();
    if (doc.exists) {
      return NextResponse.json({ message: 'Teacher profile already exists', id: teacherId }, { status: 200 });
    }

    const teacherData = {
      teacherId,
      name,
      email,
      department: department || '',
      createdAt: new Date().toISOString(),
      fcmToken: null
    };

    await teacherRef.set(teacherData);

    return NextResponse.json({ message: 'Teacher registered successfully', id: teacherId }, { status: 201 });
  } catch (error) {
    console.error('Error registering teacher:', error);
    return NextResponse.json({ error: 'Failed to register teacher' }, { status: 500 });
  }
}
