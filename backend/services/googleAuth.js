const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Helper function to instantiate an authenticated Google OAuth2 client for a teacher.
 * It fetches the stored tokens, sets them on the client, and listens for auth refreshes
 * to automatically update Firestore when a token naturally expires.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @returns {Promise<import('googleapis').Auth.OAuth2Client>} - The authenticated OAuth2 client
 */
const getAuthenticatedClient = async (teacherId) => {
  try {
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      throw new Error("Teacher profile not found.");
    }

    const teacherData = teacherDoc.data();
    
    // Ensure they have connected Google Calendar
    if (!teacherData.calendarConnected || !teacherData.googleAccessToken || !teacherData.googleRefreshToken) {
      throw new Error("Google Calendar is not connected for this teacher.");
    }

    // Clone the global client to prevent race conditions across parallel requests in Node
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set OAuth credentials
    client.setCredentials({
      access_token: teacherData.googleAccessToken,
      refresh_token: teacherData.googleRefreshToken,
      expiry_date: teacherData.googleTokenExpiry
    });

    // Listen to token refresh events securely to save them back into Firestore automatically
    client.on('tokens', async (tokens) => {
      const updates = {};
      if (tokens.access_token) {
        updates.googleAccessToken = tokens.access_token;
      }
      if (tokens.refresh_token) {
        updates.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.expiry_date) {
        updates.googleTokenExpiry = tokens.expiry_date;
      }
      
      if (Object.keys(updates).length > 0) {
        try {
          await admin.firestore().collection('teachers').doc(teacherId).update(updates);
          console.log(`--> Automatically refreshed and saved Google Token for Teacher ID: ${teacherId}`);
        } catch (dbError) {
          console.error("--> Error saving refreshed token to Firestore:", dbError);
        }
      }
    });

    return client;

  } catch (error) {
    console.error(`Error retrieving authenticated client for teacher ${teacherId}:`, error.message);
    throw error;
  }
};

module.exports = {
  oauth2Client,
  getAuthenticatedClient
};
