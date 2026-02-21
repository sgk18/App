const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { oauth2Client, getCalendarEvents } = require('../services/googleAuth');
const verifyToken = require('../middleware/authMiddleware');

/**
 * Route: GET /auth/google
 * Description: Redirects the user to Google's OAuth 2.0 consent screen.
 * Note: Must be accessed individually by a teacher to link their own Google Account.
 */
router.get('/', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar' // We only need access to Calendar
  ];

  try {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Ensures a refresh token is returned
      prompt: 'consent', // Forces consent screen to ensure refresh token is provided
      scope: scopes,
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
 * Requires: Teacher must be authenticated to associate the token with them.
 */
router.post('/callback', verifyToken, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required." });
  }

  try {
    const teacherId = req.user.uid;

    // Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens securely in Firestore
    await admin.firestore().collection('teachers').doc(teacherId).update({
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date,
      calendarConnected: true
    });

    res.status(200).json({ message: "Google Calendar connected successfully." });
  } catch (error) {
    console.error("Error during Google Auth Callback:", error);
    res.status(500).json({ error: "Failed to connect Google Calendar. Invalid or expired code." });
  }
});

/**
 * Route: GET /auth/google/events
 * Description: Fetches upcoming events from the authenticated teacher's Google Calendar.
 * Query Params (optional): timeMin (ISO string), maxResults (number)
 */
router.get('/events', verifyToken, async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const { timeMin, maxResults } = req.query;

    const parsedTimeMin = timeMin ? String(timeMin) : undefined;
    const parsedMaxResults = maxResults ? parseInt(String(maxResults), 10) : undefined;

    const events = await getCalendarEvents(teacherId, parsedTimeMin, parsedMaxResults);
    
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching Google Calendar Events:", error);
    res.status(500).json({ error: error.message || "Failed to fetch calendar events." });
  }
});

module.exports = router;
