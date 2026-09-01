import { Resend } from 'resend';
import twilio from 'twilio';

// Lazily constructed on first use, not at module import time — ESM import
// statements execute before index.js's later `dotenv.config()` call, so
// reading process.env.* at the top level here would always see undefined.
let resendClient = null;
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

let twilioClient = null;
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export async function sendBoothEmail({ to, guestName, photoUrl }) {
  const resend = getResendClient();
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
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_FROM_NUMBER) {
    return { success: false, error: 'Text messaging is not configured on this server.' };
  }
  try {
    await client.messages.create({
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
