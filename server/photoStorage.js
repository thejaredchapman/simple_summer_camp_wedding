import { put, list, del, head } from '@vercel/blob';

const PHOTO_PREFIX = 'guest-photos/';

export function buildPhotoPathname(guestName) {
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
  return `${PHOTO_PREFIX}${randomId}__${safeName}.jpg`;
}

// Metadata lives as a small companion JSON blob next to the photo, since
// Vercel Blob has no custom-metadata field and this repo has no database.
export function buildPhotoMetadataPathname(photoPathname) {
  return photoPathname.replace(/\.jpg$/, '.json');
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

export async function uploadPhotoMetadata(photoPathname, metadata) {
  const metadataPathname = buildPhotoMetadataPathname(photoPathname);
  await put(metadataPathname, JSON.stringify(metadata), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function getPhotoMetadata(photoPathname) {
  const metadataPathname = buildPhotoMetadataPathname(photoPathname);
  try {
    const blob = await head(metadataPathname);
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function listPhotos() {
  const { blobs } = await list({ prefix: PHOTO_PREFIX });
  return blobs
    .filter(blob => blob.pathname.endsWith('.jpg'))
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
  try {
    await del(buildPhotoMetadataPathname(pathname));
  } catch {
    // No companion metadata blob for photos uploaded before this feature — fine to ignore.
  }
}
