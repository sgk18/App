const express = require('express');
const router = express.Router();
const { getCalendarEvents } = require('../services/googleAuth');

/**
 * Route: GET /api/google/events
 * Description: Fetches upcoming events from the authenticated teacher's Google Calendar.
 * Note: Authentication is handled globally in protected.routes.js
 */
router.get('/events', async (req, res) => {
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
