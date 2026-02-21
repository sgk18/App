const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { oauth2Client } = require('../services/googleAuth');

/**
 * Route: GET /auth/google
 * Description: Redirects the user to Google's OAuth 2.0 consent screen.
 * Query Params: teacherId (required to associate token upon callback)
 */
router.get('/auth/google', (req, res) => {
  const { teacherId } = req.query;

  if (!teacherId) {
    return res.status(400).json({ error: "teacherId is required" });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar' // Scope for Google Calendar reading and writing
  ];

  try {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Ensures a refresh token is returned
      prompt: 'consent', // Forces consent screen to ensure refresh token is provided
      scope: scopes,
      state: teacherId // Crucial: send teacherId through Google flow so we get it back
    });

    res.status(200).json({ url: authorizationUrl });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    res.status(500).json({ error: "Failed to generate authorization URL." });
  }
});

/**
 * Route: GET /auth/google/callback
 * Description: Handles the callback from Google OAuth, exchanges the code for tokens, 
 *              and saves the tokens to the authenticated teacher's profile in Firestore.
 */
router.get('/auth/google/callback', async (req, res) => {
  console.log("--> GET /auth/google/callback HIT (PUBLIC ROUTE)");

  const code = req.query.code;
  const teacherId = req.query.state; // Extracted directly from state!

  console.log("--> Received Code:", code, "for Teacher ID:", teacherId);

  if (!code || !teacherId) {
    console.error("--> Error: Authorization code or Teacher ID missing");
    return res.status(400).json({ error: "Authorization code and matching state are required." });
  }

  try {
    console.log(`--> Processing OAuth for Teacher ID: ${teacherId}`);

    // Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("--> Token Success! Received tokens from Google.");
    
    // Save tokens securely in Firestore
    await admin.firestore().collection('teachers').doc(teacherId).update({
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date,
      calendarConnected: true
    });
    console.log(`--> Saved tokens into Firestore for Teacher ID: ${teacherId}`);

    res.status(200).json({ message: "Google Calendar connected successfully." });
  } catch (error) {
    console.error("--> Error during Google Auth Callback:", error.message);
    res.status(500).json({ error: "Failed to connect Google Calendar. Invalid or expired code." });
  }
});

module.exports = router;
