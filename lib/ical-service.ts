import ical from 'node-ical';
import axios from 'axios';
import { admin, db } from './firebase-admin';

/**
 * Fetches and parses an iCal feed from a URL.
 */
export const fetchICalEvents = async (icalUrl: string) => {
  try {
    const response = await axios.get(icalUrl);
    const events = ical.parseICS(response.data);
    
    const mappedEvents = [];
    
    for (const k in events) {
      if (Object.prototype.hasOwnProperty.call(events, k)) {
        const ev = events[k] as any;
        if (ev.type === 'VEVENT') {
          mappedEvents.push({
            eventId: ev.uid || k,
            summary: ev.summary,
            description: ev.description || '',
            start: ev.start ? (ev.start as Date).toISOString() : null,
            end: ev.end ? (ev.end as Date).toISOString() : null,
            htmlLink: ev.url || ''
          });
        }
      }
    }
    
    return mappedEvents;
  } catch (error: any) {
    console.error(`[ical.service] Error fetching iCal from ${icalUrl}:`, error.message);
    throw new Error("Failed to fetch iCal events.");
  }
};

/**
 * Syncs all iCal feeds for a teacher.
 */
export const syncICalFeeds = async (teacherId: string) => {
  try {
    const feedsSnapshot = await db.collection('teachers').doc(teacherId).collection('icalFeeds').get();
    
    if (feedsSnapshot.empty) return;

    const batch = db.batch();
    const externalEventsRef = db.collection('teachers').doc(teacherId).collection('externalEvents');

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
      } catch (feedError: any) {
        console.error(`[ical.service] Skipping feed ${feed.url} due to error:`, feedError.message);
      }
    }

    await batch.commit();
    console.log(`[ical.service] Synced iCal feeds for teacher ${teacherId}`);
  } catch (error: any) {
    console.error(`[ical.service] Global sync error for ${teacherId}:`, error.message);
  }
};
