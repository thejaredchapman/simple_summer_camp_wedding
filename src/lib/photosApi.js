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

export async function listPhotos() {
  const res = await fetch(`${BACKEND_URL}/api/photos`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to load photos.');
  }
  return data.photos;
}

export async function adminListPhotos(password) {
  const res = await fetch(`${BACKEND_URL}/api/admin/photos`, {
    headers: { 'x-admin-password': password },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to load photos.');
  }
  return data.photos;
}

export async function adminDeletePhoto(id, password) {
  const res = await fetch(
    `${BACKEND_URL}/api/admin/photos?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to delete photo.');
  }
}
