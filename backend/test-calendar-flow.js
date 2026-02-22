require('dotenv').config();
const { admin, db } = require('./config/firebase');
const { fetchCalendars, fetchCalendarEvents } = require('./services/calendar.service');

const teacherId = '9fL0KTYHSXfMAzaTLVOJfmLSHzz1';

async function runTests() {
  try {
    console.log("=== Testing fetchCalendars ===");
    const calendars = await fetchCalendars(teacherId);
    console.log(`Found ${calendars.length} calendars:`);
    calendars.forEach(cal => {
      console.log(`- [${cal.primary ? 'PRIMARY' : 'SECONDARY'}] ${cal.summary} (ID: ${cal.id})`);
    });

    console.log("\n=== Testing update of linkedCalendarId ===");
    const selectedCal = calendars.find(c => c.primary)?.id || calendars[0]?.id;
    if (selectedCal) {
      await admin.firestore().collection('teachers').doc(teacherId).update({
        linkedCalendarId: selectedCal,
        autoSyncEnabled: true
      });
      console.log(`Successfully linked calendar: ${selectedCal}`);
      
      console.log("\n=== Testing fetchCalendarEvents ===");
      const events = await fetchCalendarEvents(teacherId);
      console.log(`Fetched ${events.length} upcoming events.`);
      events.slice(0, 3).forEach(ev => {
        console.log(`  - ${ev.start}: ${ev.summary}`);
      });
    }

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    process.exit(0);
  }
}

runTests();
