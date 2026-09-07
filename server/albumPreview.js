// Scrapes the public Google Photos shared album page for a lightweight preview
// (og:title/og:image plus individual photo thumbnail URLs). There's no official
// API for reading a shared album without OAuth, so this parses the same public
// HTML a browser would load — cached in memory so we only hit Google occasionally.

const ALBUM_SHARE_URL =
  'https://photos.google.com/share/AF1QipPdzWwWAusgYWOb92nfkCyRNZavjQu5bAA6dsbK4N8wduKhya_FxIsHeAblOhTVTw?key=OUxTdkVleTBXWWIweTdGSnU0dlI5RWpaeWQ4Q3RR';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PHOTOS = 24;
const THUMBNAIL_SUFFIX = '=w400-h400-c';

let cache = null;
let cacheFetchedAt = 0;

export async function getAlbumPreview() {
  const now = Date.now();
  if (cache && now - cacheFetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  const res = await fetch(ALBUM_SHARE_URL);
  if (!res.ok) {
    throw new Error(`Album page returned ${res.status}`);
  }
  const html = await res.text();

  const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
  const coverMatch = html.match(/<meta property="og:image" content="([^"]*)"/);

  const bases = [...html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+/g)].map(
    m => m[0]
  );
  const uniqueBases = [...new Set(bases)];
  const photos = uniqueBases.slice(0, MAX_PHOTOS).map(base => `${base}${THUMBNAIL_SUFFIX}`);

  cache = {
    albumUrl: ALBUM_SHARE_URL,
    title: titleMatch ? titleMatch[1] : 'Camp Javery',
    coverImage: coverMatch ? coverMatch[1] : null,
    photos,
  };
  cacheFetchedAt = now;
  return cache;
}
