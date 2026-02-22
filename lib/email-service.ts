import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface DeadlineData {
  title: string;
  courseName?: string;
  dueDate: string;
  description?: string;
  priority: string;
}

export const sendReminderEmail = async (
  teacherEmail: string, 
  teacherName: string, 
  deadline: DeadlineData, 
  reminderType: string
) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API Key is missing. Cannot send emails.');
    return false;
  }

  let subjectLine = '';
  let timeFrameText = '';

  switch (reminderType) {
    case 'sevenDay':
      subjectLine = `Upcoming Deadline (7 Days): ${deadline.title}`;
      timeFrameText = 'in 7 days';
      break;
    case 'threeDay':
      subjectLine = `Upcoming Deadline (3 Days): ${deadline.title}`;
      timeFrameText = 'in 3 days';
      break;
    case 'oneDay':
      subjectLine = `URGENT Deadline (1 Day): ${deadline.title}`;
      timeFrameText = 'tomorrow';
      break;
    case 'sixHour':
      subjectLine = `CRITICAL: Action Required within 6 Hours - ${deadline.title}`;
      timeFrameText = 'in 6 hours';
      break;
    default:
      subjectLine = `Deadline Reminder: ${deadline.title}`;
      timeFrameText = 'soon';
  }

  const msg = {
    to: teacherEmail,
    from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
    subject: subjectLine,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #1c3d8e;">Faculty Reminder System</h2>
        <p>Dear Professor ${teacherName},</p>
        
        <p>This is an automated reminder that the deadline for <strong>${deadline.title}</strong> 
        (${deadline.courseName || 'N/A'}) is due <strong>${timeFrameText}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #1c3d8e; margin: 20px 0;">
          <p style="margin: 0;"><strong>Due Date:</strong> ${new Date(deadline.dueDate).toLocaleString()}</p>
          <p style="margin: 10px 0 0 0;"><strong>Description:</strong> ${deadline.description || 'No description provided.'}</p>
          <p style="margin: 10px 0 0 0;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${deadline.priority}</span></p>
        </div>
        
        <p>Please ensure all necessary preparations are completed.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          This is an automated message from the Faculty Reminder System. Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Reminder email (${reminderType}) sent to ${teacherEmail}`);
    return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error sending email via SendGrid:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};
