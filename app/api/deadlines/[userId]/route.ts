import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { db } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await verifyToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Ensure standard teachers can only fetch their own data
  if (authResult.user?.uid !== params.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await db.collection('deadlines')
      .where('teacherId', '==', params.userId)
      .get();
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deadlines: any[] = [];
    snapshot.forEach(doc => {
      deadlines.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(deadlines, { status: 200 });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}
