import { put, list, del, head, get } from '@vercel/blob';

const PHOTO_PREFIX = 'guest-photos/';
// Unwatermarked originals live in a completely separate prefix (not just a
// different suffix) so listPhotos()'s `list({ prefix: PHOTO_PREFIX })` can
// never see them, regardless of filename pattern.
const PHOTO_ORIGINAL_PREFIX = 'guest-photos-original/';

export function buildPhotoPathname(guestName) {
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
  return `${PHOTO_PREFIX}${randomId}__${safeName}.jpg`;
}

// The original's pathname mirrors the watermarked photo's, just under the
// private prefix, so the two are trivially derivable from one another.
export function buildPhotoOriginalPathname(photoPathname) {
  return `${PHOTO_ORIGINAL_PREFIX}${photoPathname.slice(PHOTO_PREFIX.length)}`;
}

// EXIF metadata (guest-visible via the gallery lightbox) lives as a small
// public companion JSON blob next to the photo, since Vercel Blob has no
// custom-metadata field and this repo has no database.
export function buildPhotoMetadataPathname(photoPathname) {
  return photoPathname.replace(/\.jpg$/, '.json');
}

// Admin-only info (uploader IP/user-agent, for identifying who's behind a
// joke display name) lives in a SEPARATE, `access: 'private'` blob — it
// must never share a pathname pattern with a public blob, since a public
// blob's URL is fetchable by anyone who can guess it, bypassing our own
// admin-auth check entirely.
export function buildPhotoAdminMetadataPathname(photoPathname) {
  return photoPathname.replace(/\.jpg$/, '.admin.json');
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

export async function uploadOriginalPhoto(photoPathname, buffer, contentType) {
  const originalPathname = buildPhotoOriginalPathname(photoPathname);
  await put(originalPathname, buffer, {
    access: 'private',
    contentType,
    addRandomSuffix: false,
  });
}

export async function getOriginalPhoto(photoPathname) {
  const originalPathname = buildPhotoOriginalPathname(photoPathname);
  try {
    const result = await get(originalPathname, { access: 'private' });
    if (!result || !result.stream) return null;
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType: result.blob.contentType };
  } catch {
    return null;
  }
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

export async function uploadPhotoAdminMetadata(photoPathname, adminMetadata) {
  const pathname = buildPhotoAdminMetadataPathname(photoPathname);
  await put(pathname, JSON.stringify(adminMetadata), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function getPhotoAdminMetadata(photoPathname) {
  const pathname = buildPhotoAdminMetadataPathname(photoPathname);
  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
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
  try {
    await del(buildPhotoAdminMetadataPathname(pathname));
  } catch {
    // No companion admin metadata blob for photos uploaded before this feature — fine to ignore.
  }
  try {
    await del(buildPhotoOriginalPathname(pathname));
  } catch {
    // No original blob for photos uploaded before this feature — fine to ignore.
  }
}
