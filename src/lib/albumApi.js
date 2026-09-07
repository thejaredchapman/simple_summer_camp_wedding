const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function getAlbumPreview() {
  const res = await fetch(`${BACKEND_URL}/api/album-preview`);
  if (!res.ok) {
    throw new Error('Unable to load the album preview right now.');
  }
  return res.json();
}
