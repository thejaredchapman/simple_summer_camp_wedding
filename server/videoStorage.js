import { put, list, del } from '@vercel/blob';

const VIDEO_PREFIX = 'guest-videos/';

const EXTENSION_BY_MIME_TYPE = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/3gpp': '3gp',
};

export function buildVideoPathname(guestName, contentType) {
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
  const extension = EXTENSION_BY_MIME_TYPE[contentType] || 'mp4';
  return `${VIDEO_PREFIX}${randomId}__${safeName}.${extension}`;
}

export function parseVideoPathname(pathname) {
  const filename = pathname.slice(VIDEO_PREFIX.length);
  const separatorIndex = filename.indexOf('__');
  const encodedName = separatorIndex === -1
    ? ''
    : filename.slice(separatorIndex + 2).replace(/\.[a-z0-9]+$/i, '');

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

export async function uploadVideo(buffer, guestName, contentType) {
  const pathname = buildVideoPathname(guestName, contentType);
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });
  return blob;
}

export async function listVideos() {
  const { blobs } = await list({ prefix: VIDEO_PREFIX });
  return blobs
    .map(blob => {
      const { name } = parseVideoPathname(blob.pathname);
      return {
        id: blob.pathname,
        url: blob.url,
        name,
        uploadedAt: blob.uploadedAt,
      };
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function deleteVideo(pathname) {
  await del(pathname);
}
