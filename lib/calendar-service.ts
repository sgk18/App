import { google } from 'googleapis';
import { admin, db } from './firebase-admin';
import { getAuthenticatedClient } from './google-auth';
import { getAccessToken } from './outlook-auth';
import { syncICalFeeds } from './ical-service';
import axios from 'axios';

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

interface CalendarEventData {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

/**
 * Creates an event on the teacher's selected linked calendar.
 */
export const createCalendarEvent = async (teacherId: string, eventData: CalendarEventData) => {
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
 * Fetches unified upcoming events from the teacher's externalEvents subcollection in Firestore.
 */
export const fetchCalendarEvents = async (teacherId: string, timeMin = new Date().toISOString(), _maxResults = 50) => {
  try {
    // We now pull from the Firestore collection which aggregates Google, Outlook, and iCal
    const collectionRef = db.collection('teachers').doc(teacherId).collection('externalEvents');
    const snapshot = await collectionRef
      .where('start', '>=', timeMin)
      .orderBy('start')
      .limit(1000) // Increased from 100
      .get();

    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        eventId: doc.id,
        summary: data.summary,
        description: data.description || '',
        start: data.start,
        end: data.end || '',
        htmlLink: data.htmlLink || '',
        source: data.source || 'external'
      };
    });

    console.log(`[calendar.service] Found ${events.length} synced events for teacher ${teacherId}.`);
    return events;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Error fetching synced events for teacher ${teacherId}:`, error.message);
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

    if (!data || !data.autoSyncEnabled) {
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
          maxResults: 500, // Increased from default
        });

        const batch = db.batch();
        const collectionRef = db.collection('teachers').doc(teacherId).collection('externalEvents');

        response.data.items?.forEach(item => {
          if (item.id) {
            const docRef = collectionRef.doc(`google_${item.id}`);
            batch.set(docRef, {
              summary: item.summary,
              description: item.description || null,
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date || '',
              htmlLink: item.htmlLink,
              source: 'google',
              syncedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        });

        await batch.commit();
        console.log(`[calendar.service] Synced Google events for ${teacherId}.`);
      } catch (err: any) {
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
            '$select': 'id,subject,bodyPreview,start,end,webLink',
            '$top': 500 // Increased from 50
          }
        });

        const batch = db.batch();
        const collectionRef = db.collection('teachers').doc(teacherId).collection('externalEvents');

        response.data.value.forEach((item: any) => {
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
      } catch (err: any) {
        console.error(`[calendar.service] Outlook sync failed for ${teacherId}:`, err.message);
      }
    }

    // 3. Sync iCal Feeds
    await syncICalFeeds(teacherId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[calendar.service] Global Sync Error for ${teacherId}:`, error.message);
  }
};

