import { Resend } from 'resend';
import twilio from 'twilio';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export async function sendBoothEmail({ to, guestName, photoUrl }) {
  if (!resend || !process.env.RESEND_EMAIL_DOMAIN) {
    return { success: false, error: 'Email is not configured on this server.' };
  }
  try {
    await resend.emails.send({
      from: `Camp Javery Photo Booth <photobooth@${process.env.RESEND_EMAIL_DOMAIN}>`,
      to,
      subject: 'Your Camp Javery photo booth strip!',
      html: `
        <p>Hi ${guestName || 'there'},</p>
        <p>Here's your photo strip from the Camp Javery photo booth:</p>
        <p><img src="${photoUrl}" alt="Your photo strip" style="max-width:400px; display:block;" /></p>
        <p><a href="${photoUrl}">Open full size</a></p>
        <p>#CampJavery</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Booth email send error:', error.message);
    return { success: false, error: 'Could not send the email. Please try again.' };
  }
}

export async function sendBoothText({ to, photoUrl }) {
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
    return { success: false, error: 'Text messaging is not configured on this server.' };
  }
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body: 'Your Camp Javery photo booth strip! #CampJavery',
      mediaUrl: [photoUrl],
    });
    return { success: true };
  } catch (error) {
    console.error('Booth text send error:', error.message);
    return { success: false, error: 'Could not send the text. Check the phone number and try again.' };
  }
}
