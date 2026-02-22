import { NextRequest } from "next/server";
import { auth } from "./firebase-admin";

export async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401 };
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return { user: decodedToken, status: 200 };
  } catch {
    return { error: "Unauthorized access", status: 403 };
  }
}
