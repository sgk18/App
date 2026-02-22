import * as admin from 'firebase-admin';

// Initialize Firebase Admin App if not already initialized
// This prevents Next.js hot-reload from attempting to initialize multiple times in development
if (!admin.apps.length) {
  try {
    // Format private key properly for Vercel/Node environment (handles literal '\n' escaping)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully in Next.js');
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

// Export the initialized DB, Auth, and the core admin object
const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
