import { uploadWithProgress } from './uploadWithProgress';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    return data?.error || GENERIC_ERROR_MESSAGE;
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }
}

export async function uploadPhoto(guestName, file, metadata, onProgress) {
  const formData = new FormData();
  formData.append('guestName', guestName);
  formData.append('photo', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  return uploadWithProgress(`${BACKEND_URL}/api/photos/upload`, formData, onProgress);
}

export async function listPhotos() {
  const res = await fetch(`${BACKEND_URL}/api/photos`);

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = await res.json();
  return data.photos;
}

export async function getPhotoMetadata(photoId) {
  const res = await fetch(`${BACKEND_URL}/api/photos/metadata?id=${encodeURIComponent(photoId)}`);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = await res.json();
  return data.metadata;
}

export async function adminListPhotos(password) {
  const res = await fetch(`${BACKEND_URL}/api/admin/photos`, {
    headers: { 'x-admin-password': password },
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = await res.json();
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

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
}
