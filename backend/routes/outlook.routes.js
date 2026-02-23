const express = require('express');
const router = express.Router();
const { getAuthUrl, acquireTokenByCode } = require('../services/outlookAuth');

/**
 * Route: GET /auth/outlook
 * Redirects the user to Microsoft's OAuth 2.0 consent screen.
 */
router.get('/auth/outlook', async (req, res) => {
  const { teacherId } = req.query;

  if (!teacherId) {
    return res.status(400).json({ error: "teacherId is required." });
  }

  try {
    const url = await getAuthUrl(teacherId);
    res.status(200).json({ url });
  } catch (error) {
    console.error("Error generating Outlook Auth URL:", error);
    res.status(500).json({ error: "Failed to generate authorization URL." });
  }
});

/**
 * Route: GET /auth/outlook/callback
 * Handles the callback from Microsoft OAuth.
 */
router.get('/auth/outlook/callback', async (req, res) => {
  const { code, state: teacherId } = req.query;

  if (!code || !teacherId) {
    return res.status(400).json({ error: "Code and teacherId are required." });
  }

  try {
    await acquireTokenByCode(code, teacherId);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings?outlook_connected=true`);
  } catch (error) {
    console.error("Error during Outlook Auth Callback:", error);
    res.status(500).json({ error: "Failed to connect Outlook Calendar." });
  }
});

module.exports = router;
