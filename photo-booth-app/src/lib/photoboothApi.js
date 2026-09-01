import SmsShare from 'camp-javery-sms-share';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    return data?.error || 'Something went wrong. Please try again.';
  } catch {
    return 'Something went wrong. Please try again.';
  }
}

export async function uploadBoothStrip(stripDataUrl, guestName = '') {
  const formData = new FormData();
  formData.append('photo', dataUrlToBlob(stripDataUrl), 'strip.jpg');
  if (guestName) formData.append('guestName', guestName);

  const res = await fetch(`${BACKEND_URL}/api/photobooth/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return res.json();
}

export async function sendBoothEmail({ photoUrl, guestName, email }) {
  const res = await fetch(`${BACKEND_URL}/api/photobooth/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl, guestName, email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return res.json();
}

// Opens the phone's own Messages app with the strip attached and the number
// pre-filled — no backend call, no SMS provider. `stripDataUrl` is the
// in-memory data URL from Capture/Review, not a re-fetch of the uploaded URL.
export async function shareBoothStripBySms(phoneNumber, stripDataUrl) {
  const base64Image = stripDataUrl.split(',')[1];
  return SmsShare.shareImage({ phoneNumber, base64Image });
}
