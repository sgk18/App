const ical = require('node-ical');
const axios = require('axios');
const admin = require('firebase-admin');

/**
 * Fetches and parses an iCal feed from a URL.
 */
const fetchICalEvents = async (icalUrl) => {
  try {
    const response = await axios.get(icalUrl);
    const events = ical.parseICS(response.data);
    
    const mappedEvents = [];
    
    for (const k in events) {
      if (events.hasOwnProperty(k)) {
        const ev = events[k];
        if (ev.type === 'VEVENT') {
          mappedEvents.push({
            eventId: ev.uid || k,
            summary: ev.summary,
            description: ev.description || '',
            start: ev.start ? ev.start.toISOString() : null,
            end: ev.end ? ev.end.toISOString() : null,
            htmlLink: ev.url || ''
          });
        }
      }
    }
    
    return mappedEvents;
  } catch (error) {
    console.error(`[ical.service] Error fetching iCal from ${icalUrl}:`, error.message);
    throw new Error("Failed to fetch iCal events.");
  }
};

/**
 * Syncs all iCal feeds for a teacher.
 */
const syncICalFeeds = async (teacherId) => {
  try {
    const feedsSnapshot = await admin.firestore().collection('teachers').doc(teacherId).collection('icalFeeds').get();
    
    if (feedsSnapshot.empty) return;

    const batch = admin.firestore().batch();
    const externalEventsRef = admin.firestore().collection('teachers').doc(teacherId).collection('externalEvents');

    for (const doc of feedsSnapshot.docs) {
      const feed = doc.data();
      try {
        const events = await fetchICalEvents(feed.url);
        
        events.forEach(event => {
          // Use a combination of feed ID and event ID to prevent collisions across multiple feeds
          const docId = `ical_${doc.id}_${event.eventId}`;
          const docRef = externalEventsRef.doc(docId);
          
          batch.set(docRef, {
            summary: event.summary,
            description: event.description,
            start: event.start,
            end: event.end,
            htmlLink: event.htmlLink,
            source: 'ical',
            feedId: doc.id,
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
      } catch (feedError) {
        console.error(`[ical.service] Skipping feed ${feed.url} due to error:`, feedError.message);
      }
    }

    await batch.commit();
    console.log(`[ical.service] Synced iCal feeds for teacher ${teacherId}`);
  } catch (error) {
    console.error(`[ical.service] Global sync error for ${teacherId}:`, error.message);
  }
};

module.exports = {
  fetchICalEvents,
  syncICalFeeds
};
