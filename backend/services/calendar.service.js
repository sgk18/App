const { getAuthenticatedClient } = require('./googleAuth');
const { getAccessToken } = require('./outlookAuth');
const { syncICalFeeds } = require('./ical-service');
const axios = require('axios');

/**
 * Fetches the user's Google Calendars so they can select which one to link.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @returns {Promise<Array>} - List of available calendars
 */
const fetchCalendars = async (teacherId) => {
  try {
    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

    const response = await calendarAPI.calendarList.list({
      minAccessRole: 'writer' // only show calendars they can add events to
    });

    // Map to a cleaner object for the frontend
    const calendars = response.data.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor
    }));

    return calendars;
  } catch (error) {
    console.error(`[calendar.service] Error fetching calendars for teacher ${teacherId}:`, error.message);
    throw new Error("Failed to fetch Google Calendars.");
  }
};

/**
 * Creates an event on the teacher's selected linked calendar.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @param {Object} eventData - The event details (summary, description, start/end)
 * @returns {Promise<string>} - The created event ID
 */
const createCalendarEvent = async (teacherId, eventData) => {
  try {
    // 1. Get Teacher's linkedCalendarId from Firestore
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    const linkedCalendarId = teacherDoc.data()?.linkedCalendarId;

    if (!linkedCalendarId) {
      throw new Error("No specific Google Calendar has been linked yet.");
    }

    // 2. Get the authenticated client
    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

    // 3. Construct and insert the event
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: new Date(eventData.start.dateTime).toISOString(),
      },
      end: {
        dateTime: new Date(eventData.end.dateTime).toISOString(),
      },
    };

    const response = await calendarAPI.events.insert({
      calendarId: linkedCalendarId,
      resource: event,
    });

    console.log(`[calendar.service] Event created on calendar ${linkedCalendarId} for teacher ${teacherId}.`);
    return response.data.id;
  } catch (error) {
    console.error(`[calendar.service] Error creating event for teacher ${teacherId}:`, error.message);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Fetches upcoming events from the teacher's explicitly linked calendar.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @param {string} timeMin - The minimum start time (ISO string)
 * @param {number} maxResults - The maximum number of events
 * @returns {Promise<Array>} - List of mapped events
 */
const fetchCalendarEvents = async (teacherId, timeMin = new Date().toISOString(), maxResults = 50) => {
  try {
    // 1. Get Teacher's linkedCalendarId
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    const linkedCalendarId = teacherDoc.data()?.linkedCalendarId;

    if (!linkedCalendarId) {
      throw new Error("No Google Calendar mapped. Please select a calendar in settings.");
    }

    // 2. Get Authenticated Client
    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

    // 3. Fetch from the specific linked calendar
    const response = await calendarAPI.events.list({
      calendarId: linkedCalendarId,
      timeMin: timeMin,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];
    console.log(`[calendar.service] Found ${items.length} upcoming events for teacher ${teacherId}.`);

    // 4. Map the events cleanly
    const events = items.map(event => ({
      eventId: event.id,
      summary: event.summary,
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      htmlLink: event.htmlLink || ''
    }));

    return events;
  } catch (error) {
    console.error(`[calendar.service] Error fetching upcoming events for teacher ${teacherId}:`, error.message);
    throw new Error("Failed to fetch calendar events.");
  }
};

/**
 * Pulls external events and syncs them directly into the Firestore externalEvents subcollection.
 * Handles the background auto-sync logic if enabled.
 */
const syncExternalEvents = async (teacherId) => {
  try {
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    const data = teacherDoc.data();

    if (!data.autoSyncEnabled) {
      console.log(`[calendar.service] Sync skipped: Not enabled for ${teacherId}.`);
      return;
    }

    // 1. Sync Google Calendar if connected
    if (data.linkedCalendarId) {
      try {
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);

        const auth = await getAuthenticatedClient(teacherId);
        const calendarAPI = google.calendar({ version: "v3", auth });

        const response = await calendarAPI.events.list({
          calendarId: data.linkedCalendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        const batch = admin.firestore().batch();
        const collectionRef = admin.firestore().collection('teachers').doc(teacherId).collection('externalEvents');

        response.data.items.forEach(item => {
          const docRef = collectionRef.doc(`google_${item.id}`);
          batch.set(docRef, {
            summary: item.summary,
            description: item.description || null,
            start: item.start.dateTime || item.start.date,
            end: item.end.dateTime || item.end.date,
            htmlLink: item.htmlLink,
            source: 'google',
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });

        await batch.commit();
        console.log(`[calendar.service] Synced Google events for ${teacherId}.`);
      } catch (err) {
        console.error(`[calendar.service] Google sync failed for ${teacherId}:`, err.message);
      }
    }

    // 2. Sync Outlook Calendar if connected
    if (data.outlookCalendarConnected) {
      try {
        const token = await getAccessToken(teacherId);
        const response = await axios.get('https://graph.microsoft.com/v1.0/me/calendar/events', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            '$select': 'subject,bodyPreview,start,end,webLink',
            '$top': 50
          }
        });

        const batch = admin.firestore().batch();
        const collectionRef = admin.firestore().collection('teachers').doc(teacherId).collection('externalEvents');

        response.data.value.forEach(item => {
          const docRef = collectionRef.doc(`outlook_${item.id}`);
          batch.set(docRef, {
            summary: item.subject,
            description: item.bodyPreview || null,
            start: item.start.dateTime,
            end: item.end.dateTime,
            htmlLink: item.webLink,
            source: 'outlook',
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });

        await batch.commit();
        console.log(`[calendar.service] Synced Outlook events for ${teacherId}.`);
      } catch (err) {
        console.error(`[calendar.service] Outlook sync failed for ${teacherId}:`, err.message);
      }
    }

    // 3. Sync iCal Feeds
    await syncICalFeeds(teacherId);

  } catch (error) {
    console.error(`[calendar.service] Sync Error for ${teacherId}:`, error.message);
  }
};

module.exports = {
  fetchCalendars,
  createCalendarEvent,
  fetchCalendarEvents,
  syncExternalEvents
};
