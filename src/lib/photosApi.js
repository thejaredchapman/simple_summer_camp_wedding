const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function uploadPhoto(guestName, file) {
  const formData = new FormData();
  formData.append('guestName', guestName);
  formData.append('photo', file);

  const res = await fetch(`${BACKEND_URL}/api/photos/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed. Please try again.');
  }
  return data;
}
