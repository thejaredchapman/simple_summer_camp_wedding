import { uploadWithProgress } from './uploadWithProgress.js';

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

export async function uploadVideo(guestName, file, onProgress) {
  const formData = new FormData();
  formData.append('guestName', guestName);
  formData.append('video', file);
  return uploadWithProgress(`${BACKEND_URL}/api/videos/upload`, formData, onProgress);
}

export async function listVideos() {
  const res = await fetch(`${BACKEND_URL}/api/videos`);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = await res.json();
  return data.videos;
}

export async function adminListVideos(password) {
  const res = await fetch(`${BACKEND_URL}/api/admin/videos`, {
    headers: { 'x-admin-password': password },
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = await res.json();
  return data.videos;
}

export async function adminDeleteVideo(id, password) {
  const res = await fetch(
    `${BACKEND_URL}/api/admin/videos?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }
  );
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
}
