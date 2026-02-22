import { google } from 'googleapis';
import { admin, db } from './firebase-admin';
import { getAuthenticatedClient } from './google-auth';

/**
 * Fetches the user's Google Calendars so they can select which one to link.
 */
export const fetchCalendars = async (teacherId: string) => {
  try {
    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

    const response = await calendarAPI.calendarList.list({
      minAccessRole: 'writer' // only show calendars they can add events to
    });

    const calendars = response.data.items?.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor
    })) || [];

    return calendars;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Error fetching calendars for teacher ${teacherId}:`, error.message);
    throw new Error("Failed to fetch Google Calendars.");
  }
};

/**
 * Creates an event on the teacher's selected linked calendar.
 */
export const createCalendarEvent = async (teacherId: string, eventData: any) => {
  try {
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    const linkedCalendarId = teacherDoc.data()?.linkedCalendarId;

    if (!linkedCalendarId) {
      throw new Error("No specific Google Calendar has been linked yet.");
    }

    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

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
      requestBody: event,
    });

    console.log(`[calendar.service] Event created on calendar ${linkedCalendarId} for teacher ${teacherId}.`);
    return response.data.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Error creating event for teacher ${teacherId}:`, error.message);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Fetches upcoming events from the teacher's explicitly linked calendar.
 */
export const fetchCalendarEvents = async (teacherId: string, timeMin = new Date().toISOString(), maxResults = 50) => {
  try {
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    const linkedCalendarId = teacherDoc.data()?.linkedCalendarId;

    if (!linkedCalendarId) {
      throw new Error("No Google Calendar mapped. Please select a calendar in settings.");
    }

    const auth = await getAuthenticatedClient(teacherId);
    const calendarAPI = google.calendar({ version: "v3", auth });

    const response = await calendarAPI.events.list({
      calendarId: linkedCalendarId,
      timeMin: timeMin,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];
    console.log(`[calendar.service] Found ${items.length} upcoming events for teacher ${teacherId}.`);

    const events = items.map(event => ({
      eventId: event.id,
      summary: event.summary,
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      htmlLink: event.htmlLink || ''
    }));

    return events;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Error fetching upcoming events for teacher ${teacherId}:`, error.message);
    throw new Error("Failed to fetch calendar events.");
  }
};

/**
 * Pulls external events and syncs them directly into the Firestore externalEvents subcollection.
 * Handles the background auto-sync logic if enabled.
 */
export const syncExternalEvents = async (teacherId: string) => {
  try {
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    const data = teacherDoc.data();

    // Check if sync is even enabled.
    if (!data?.autoSyncEnabled || !data?.linkedCalendarId) {
      console.log(`[calendar.service] Sync skipped: Not enabled or configured for ${teacherId}.`);
      return;
    }

    // Pull events from the next 30 days
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

    const batch = db.batch();
    const collectionRef = db.collection('teachers').doc(teacherId).collection('externalEvents');

    if (response.data.items) {
      response.data.items.forEach(item => {
        if (item.id && item.start) {
          // Use the Google Event ID as the document ID for idempotency (upsert logic)
          const docRef = collectionRef.doc(item.id);
          batch.set(docRef, {
            summary: item.summary,
            description: item.description || null,
            start: item.start.dateTime || item.start.date,
            end: item.end?.dateTime || item.end?.date || '',
            htmlLink: item.htmlLink,
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      });
      await batch.commit();
      console.log(`[calendar.service] Successfully synced ${response.data.items.length} events for ${teacherId}.`);
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Sync Error for ${teacherId}:`, error.message);
    // Don't throw, let background jobs fail gracefully
  }
};
