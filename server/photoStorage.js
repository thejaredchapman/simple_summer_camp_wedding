import { put, list, del, head } from '@vercel/blob';
import { createHmac } from 'node:crypto';

const PHOTO_PREFIX = 'guest-photos/';
// Admin-only data (unwatermarked originals, uploader IP/user-agent) lives
// under this prefix, so listPhotos()'s `list({ prefix: PHOTO_PREFIX })`
// never sees it regardless of filename pattern.
const ADMIN_PREFIX = 'admin-private/';

export function buildPhotoPathname(guestName) {
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
  return `${PHOTO_PREFIX}${randomId}__${safeName}.jpg`;
}

// This store was created public-only — Vercel Blob's `access: 'private'`
// requires the *store* to be provisioned for private access at creation
// time (an immutable, dashboard/CLI-only setting), so per-blob private
// access isn't available here. Admin-only blobs use this store's only
// available access level (public) but at a pathname an outsider cannot
// derive: an HMAC of the photo's pathname, keyed on ADMIN_PASSWORD (already
// required and already configured everywhere this app runs — no new
// secret to provision). Deterministic, so the server can always recompute
// it from a photo's id without needing a lookup table this repo has
// nowhere to store. Rotating ADMIN_PASSWORD orphans existing admin blobs —
// an acceptable tradeoff for a wedding site's admin panel.
function buildAdminPathname(kind, photoPathname, extension) {
  const secret = process.env.ADMIN_PASSWORD || '';
  const hash = createHmac('sha256', secret).update(`${kind}:${photoPathname}`).digest('hex');
  return `${ADMIN_PREFIX}${hash}.${extension}`;
}

export function buildPhotoOriginalPathname(photoPathname) {
  return buildAdminPathname('original', photoPathname, 'jpg');
}

export function buildPhotoAdminMetadataPathname(photoPathname) {
  return buildAdminPathname('admin-metadata', photoPathname, 'json');
}

// EXIF metadata (guest-visible via the gallery lightbox) lives as a small
// public companion JSON blob next to the photo, since Vercel Blob has no
// custom-metadata field and this repo has no database.
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

export async function uploadOriginalPhoto(photoPathname, buffer, contentType) {
  const originalPathname = buildPhotoOriginalPathname(photoPathname);
  await put(originalPathname, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });
}

export async function getOriginalPhoto(photoPathname) {
  const originalPathname = buildPhotoOriginalPathname(photoPathname);
  try {
    const blob = await head(originalPathname);
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType: blob.contentType };
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
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function getPhotoAdminMetadata(photoPathname) {
  const pathname = buildPhotoAdminMetadataPathname(photoPathname);
  try {
    const blob = await head(pathname);
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
