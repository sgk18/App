import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) return;

  // Attempt 1: Load from Environment Variables
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  let projectId = process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

  if (privateKey && projectId && clientEmail) {
    try {
      // Clean environment artifacts
      privateKey = privateKey.replace(/['"]/g, '').trim().replace(/\\n/g, '\n').replace(/\r/g, '');
      if (projectId.includes('.')) projectId = projectId.split('.')[0];
      projectId = projectId.replace(/['"]/g, '').trim();

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`[firebase-admin] Initialized via environment for project: ${projectId}`);
      return;
    } catch (envError: any) {
      console.warn(`[firebase-admin] Environment init failed: ${envError.message}`);
    }
  }

  // Attempt 2: Fallback to serviceAccountKey.json (local development)
  const saPath = path.join(process.cwd(), 'backend', 'serviceAccountKey.json');
  if (fs.existsSync(saPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebase-admin] Initialized via serviceAccountKey.json fallback');
      return;
    } catch (saError: any) {
      console.error(`[firebase-admin] Fallback init failed: ${saError.message}`);
    }
  }

  console.error('[firebase-admin] Critical: Firebase Admin SDK failed to initialize. Project state may be inconsistent.');
};

initFirebaseAdmin();

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

try {
  db = admin.firestore();
  auth = admin.auth();
} catch (error) {
  console.error('[firebase-admin] Failed to initialize Firestore/Auth:', error);
}

export { db, auth, admin };
