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

export async function sendBoothStrip({ photoUrl, guestName, email, phone }) {
  const res = await fetch(`${BACKEND_URL}/api/photobooth/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl, guestName, email, phone }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return res.json();
}
