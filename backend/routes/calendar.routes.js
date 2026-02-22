const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { fetchCalendars, fetchCalendarEvents } = require('../services/calendar.service');

// All routes here are automatically protected by verifyToken from protected.routes.js!

/**
 * Route: GET /api/calendar/list
 * Description: Fetches all the Google Calendars available to the teacher to choose from.
 */
router.get('/list', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const calendars = await fetchCalendars(teacherId);
    res.status(200).json({ calendars });
  } catch (error) {
    console.error("Error fetching calendars:", error.message);
    res.status(500).json({ error: "Failed to load calendars. Your Google Calendar might need refreshing." });
  }
});

/**
 * Route: POST /api/calendar/select
 * Description: Links a specific Google Calendar to the teacher's profile.
 * Body: { calendarId }
 */
router.post('/select', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const { calendarId } = req.body;

    if (!calendarId) {
      return res.status(400).json({ error: "No calendarId provided." });
    }

    // Save the choice in Firestore
    await admin.firestore().collection('teachers').doc(teacherId).update({
      linkedCalendarId: calendarId,
      autoSyncEnabled: true // Enable by default when linked
    });

    res.status(200).json({ message: "Calendar successfully linked." });
  } catch (error) {
    console.error("Error linking calendar:", error.message);
    res.status(500).json({ error: "Failed to link calendar." });
  }
});

/**
 * Route: GET /api/calendar/events
 * Description: Fetches upcoming events from the currently linked calendar.
 */
router.get('/events', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const events = await fetchCalendarEvents(teacherId);
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching upcoming events:", error.message);
    // Might not have a calendar linked yet, handle gracefully
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
