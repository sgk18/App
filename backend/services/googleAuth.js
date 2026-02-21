const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Helper function to create a calendar event for a specific teacher.
 * Fetches the teacher's stored tokens, sets the credentials, and makes the API call.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @param {Object} deadlineData - The event details (summary, description, start/end times)
 * @returns {Promise<string>} - The Google Calendar Event ID
 */
const createCalendarEvent = async (teacherId, deadlineData) => {
  try {
    // 1. Fetch teacher doc from Firestore
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      throw new Error("Teacher profile not found.");
    }

    const teacherData = teacherDoc.data();
    
    // 2. Ensure they have connected Google Calendar
    if (!teacherData.calendarConnected || !teacherData.googleAccessToken || !teacherData.googleRefreshToken) {
      throw new Error("Google Calendar is not connected for this teacher.");
    }

    // 3. Set OAuth credentials (includes refresh token for automatic refreshing)
    oauth2Client.setCredentials({
      access_token: teacherData.googleAccessToken,
      refresh_token: teacherData.googleRefreshToken,
      expiry_date: teacherData.googleTokenExpiry
    });

    // Handle token refresh events to keep Firestore updated if the token refreshes automatically
    oauth2Client.on('tokens', async (tokens) => {
      const updates = {};
      if (tokens.access_token) {
        updates.googleAccessToken = tokens.access_token;
      }
      if (tokens.refresh_token) {
        updates.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.expiry_date) {
        updates.googleTokenExpiry = tokens.expiry_date;
      }
      
      if (Object.keys(updates).length > 0) {
        await admin.firestore().collection('teachers').doc(teacherId).update(updates);
      }
    });

    // 4. Initialize Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 5. Create the event
    const event = {
      summary: deadlineData.summary,
      description: deadlineData.description,
      start: {
        dateTime: new Date(deadlineData.start.dateTime).toISOString(),
      },
      end: {
        dateTime: new Date(deadlineData.end.dateTime).toISOString(),
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error(`Error creating calendar event for teacher ${teacherId}:`, error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Helper function to fetch upcoming calendar events for a specific teacher.
 * 
 * @param {string} teacherId - The Firebase UID of the teacher
 * @param {string} timeMin - The minimum start time of the events to fetch (ISO string)
 * @param {number} maxResults - The maximum number of events to fetch
 * @returns {Promise<Array>} - List of parsed Google Calendar events
 */
const getCalendarEvents = async (teacherId, timeMin = new Date().toISOString(), maxResults = 50) => {
  try {
    // 1. Fetch teacher doc from Firestore
    const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      throw new Error("Teacher profile not found.");
    }

    const teacherData = teacherDoc.data();
    
    // 2. Ensure they have connected Google Calendar
    if (!teacherData.calendarConnected || !teacherData.googleAccessToken || !teacherData.googleRefreshToken) {
      throw new Error("Google Calendar is not connected for this teacher.");
    }

    // 3. Set OAuth credentials
    oauth2Client.setCredentials({
      access_token: teacherData.googleAccessToken,
      refresh_token: teacherData.googleRefreshToken,
      expiry_date: teacherData.googleTokenExpiry
    });

    // 4. Initialize Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 5. Fetch the events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    // 6. Map and return the relevant details
    const events = response.data.items.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      htmlLink: event.htmlLink
    }));

    return events;
  } catch (error) {
    console.error(`Error fetching calendar events for teacher ${teacherId}:`, error);
    throw new Error(`Failed to fetch calendar events: ${error.message}`);
  }
};

module.exports = {
  oauth2Client,
  createCalendarEvent,
  getCalendarEvents
};
