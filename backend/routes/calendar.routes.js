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

/**
 * Route: POST /api/calendar/ical/link
 * Description: Links an iCal feed to the teacher's profile.
 */
router.post('/ical/link', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const { icalUrl, label } = req.body;

    if (!icalUrl) {
      return res.status(400).json({ error: "No iCal URL provided." });
    }

    const newFeed = {
      id: admin.firestore().collection('teachers').doc(teacherId).collection('icalFeeds').doc().id,
      url: icalUrl,
      label: label || "External iCal",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('teachers').doc(teacherId).collection('icalFeeds').doc(newFeed.id).set(newFeed);

    res.status(200).json({ message: "iCal feed linked successfully.", feed: newFeed });
  } catch (error) {
    console.error("Error linking iCal:", error.message);
    res.status(500).json({ error: "Failed to link iCal feed." });
  }
});

/**
 * Route: DELETE /api/calendar/ical/:feedId
 * Description: Removes an iCal feed.
 */
router.delete('/ical/:feedId', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const { feedId } = req.params;

    await admin.firestore().collection('teachers').doc(teacherId).collection('icalFeeds').doc(feedId).delete();

    res.status(200).json({ message: "iCal feed removed." });
  } catch (error) {
    console.error("Error removing iCal feed:", error.message);
    res.status(500).json({ error: "Failed to remove iCal feed." });
  }
});

/**
 * Route: GET /api/calendar/ical/list
 * Description: Lists all iCal feeds for the teacher.
 */
router.get('/ical/list', async (req, res) => {
  try {
    const teacherId = req.user.uid;
    const snapshot = await admin.firestore().collection('teachers').doc(teacherId).collection('icalFeeds').get();
    const feeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ feeds });
  } catch (error) {
    console.error("Error listing iCal feeds:", error.message);
    res.status(500).json({ error: "Failed to list iCal feeds." });
  }
});

module.exports = router;
