import { put, list, del } from '@vercel/blob';

const PHOTO_PREFIX = 'guest-photos/';

export function buildPhotoPathname(guestName) {
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
  return `${PHOTO_PREFIX}${randomId}__${safeName}.jpg`;
}

export function parsePhotoPathname(pathname) {
  const filename = pathname.slice(PHOTO_PREFIX.length);
  const separatorIndex = filename.indexOf('__');
  const encodedName = separatorIndex === -1
    ? ''
    : filename.slice(separatorIndex + 2).replace(/\.jpg$/, '');

  let name = 'Guest';
  if (encodedName) {
    try {
      name = decodeURIComponent(encodedName);
    } catch {
      name = 'Guest';
    }
  }
  return { name };
}

export async function uploadPhoto(buffer, guestName, contentType) {
  const pathname = buildPhotoPathname(guestName);
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });
  return blob;
}

export async function listPhotos() {
  const { blobs } = await list({ prefix: PHOTO_PREFIX });
  return blobs
    .map(blob => {
      const { name } = parsePhotoPathname(blob.pathname);
      return {
        id: blob.pathname,
        url: blob.url,
        name,
        uploadedAt: blob.uploadedAt,
      };
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function deletePhoto(pathname) {
  await del(pathname);
}
