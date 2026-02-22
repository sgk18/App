const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { oauth2Client } = require('../services/googleAuth');

/**
 * Route: GET /auth/google
 * Description: Redirects the user to Google's OAuth 2.0 consent screen.
 * Query Params: teacherId (required to associate token upon callback)
 */
router.get('/auth/google', (req, res) => {
  const { teacherId } = req.query;

  // 1. Validate teacherId rigorously
  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    return res.status(400).json({ error: "teacherId is required and must be a valid string." });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar' // Scope for Google Calendar reading and writing
  ];

  try {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Ensures a refresh token is returned
      prompt: 'consent', // Forces consent screen to ensure refresh token is provided
      scope: scopes,
      state: teacherId.trim() // Crucial: send teacherId through Google flow so we get it back
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
 *              This is a PUBLIC route so Google can access it directly.
 */
router.get('/auth/google/callback', async (req, res) => {
  console.log("--> GET /auth/google/callback HIT (PUBLIC ROUTE)");

  // Extract from query parameters (GET)
  const code = req.query.code;
  const teacherId = req.query.state; // Extracted directly from state!

  console.log("--> Received Code:", code ? "[REDACTED]" : "undefined", "for Teacher ID:", teacherId);

  // 2. Validate extracted variables
  if (!code || typeof code !== 'string') {
    console.error("--> Error: Authorization code missing or invalid");
    return res.status(400).json({ error: "Authorization code is required." });
  }

  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    console.error("--> Error: Teacher ID (state) missing or invalid");
    return res.status(400).json({ error: "Matching state (teacherId) is required." });
  }

  try {
    console.log(`--> Processing OAuth for Teacher ID: ${teacherId}`);

    // Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("--> Token Success! Received tokens from Google.");
    
    // Set credentials temporarily for testing (optional but good practice)
    oauth2Client.setCredentials(tokens);

    // Save tokens securely in Firestore
    // Using .set({ ... }, { merge: true }) ensures the document is created if it does not yet exist.
    await admin.firestore().collection('teachers').doc(teacherId).set({
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token, // Guaranteed by prompt: 'consent'
      googleTokenExpiry: tokens.expiry_date,
      calendarConnected: true,
      calendarConnectedAt: admin.firestore.FieldValue.serverTimestamp() // Track insertion time
    }, { merge: true });
    console.log(`--> Saved tokens into Firestore for Teacher ID: ${teacherId}`);

    // Redirect back to the frontend settings page with a success flag
    res.redirect('http://localhost:3000/settings?calendar_connected=true');
  } catch (error) {
    console.error("--> Error during Google Auth Callback. Message:", error.message);
    let errorDump = "Raw Error: " + error.message;

    if (error.response && error.response.data) {
      errorDump = "Google API Error Details: " + JSON.stringify(error.response.data, null, 2);
      console.error("-->", errorDump);
    } else {
      errorDump = "Full Error Stack: " + error.stack;
      console.error("-->", errorDump);
    }

    try {
      fs.writeFileSync(path.join(__dirname, '../oauth-error-dump.txt'), new Date().toISOString() + "\n" + errorDump + "\n\n", { flag: 'a' });
    } catch(e) {}

    res.status(500).json({ error: "Failed to connect Google Calendar. Invalid or expired code." });
  }
});

module.exports = router;
