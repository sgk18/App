const cron = require('node-cron');
const { db } = require('../config/firebase');
const { sendReminderEmail } = require('./emailService');

// Calculates the true hours remaining until the deadline
const getHoursRemaining = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60);
};

// Scheduler running every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running deadline reminder scheduler...');
  try {
    const deadlinesSnapshot = await db.collection('deadlines').get();
    
    deadlinesSnapshot.forEach(async (doc) => {
      const deadline = { id: doc.id, ...doc.data() };
      const hoursRemaining = getHoursRemaining(deadline.dueDate);

      // Skip past deadlines
      if (hoursRemaining < 0) return;

      let reminderToSent = null;

      if (hoursRemaining <= 6 && hoursRemaining > 0 && !deadline.reminderSent?.sixHour) {
        reminderToSent = 'sixHour';
      } else if (hoursRemaining <= 24 && hoursRemaining > 6 && !deadline.reminderSent?.oneDay) {
        reminderToSent = 'oneDay';
      } else if (hoursRemaining <= 72 && hoursRemaining > 24 && !deadline.reminderSent?.threeDay) {
        reminderToSent = 'threeDay';
      } else if (hoursRemaining <= 168 && hoursRemaining > 72 && !deadline.reminderSent?.sevenDay) {
        reminderToSent = 'sevenDay';
      }

      if (reminderToSent) {
        // Fetch teacher details for email
        const teacherDoc = await db.collection('teachers').doc(deadline.teacherId).get();
        if (teacherDoc.exists) {
          const teacher = teacherDoc.data();
          
          const emailSent = await sendReminderEmail(
            teacher.email, 
            teacher.name, 
            deadline, 
            reminderToSent
          );

          if (emailSent) {
            // Update Firestore so we don't send this specific reminder again
            const updateField = `reminderSent.${reminderToSent}`;
            await db.collection('deadlines').doc(doc.id).update({
              [updateField]: true
            });
            console.log(`Updated Firestore for deadline ${deadline.title} (${reminderToSent} flag)`);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error running scheduler:', error);
  }
});
