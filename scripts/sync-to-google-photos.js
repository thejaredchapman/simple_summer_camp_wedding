#!/usr/bin/env node
import { OAuth2Client } from 'google-auth-library';
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../server/.env', import.meta.url).pathname });

const { listPhotos } = await import('../server/photoStorage.js');
const { listVideos } = await import('../server/videoStorage.js');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(process.cwd(), 'server', 'google-photos-token.json');
const ALBUM_TITLE = 'Camp Javery Wedding';
const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.appendonly'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in server/.env.');
  console.error('See README.md "Post-Wedding Google Photos Archive" for setup steps.');
  process.exit(1);
}

async function readTokenCache() {
  try {
    const raw = await readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeTokenCache(tokens) {
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

function runLoopbackOAuthFlow() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const code = url.searchParams.get('code');
        if (!code) return;

        res.end('Authorized. You can close this tab and return to the terminal.');
        const redirectUri = `http://localhost:${server.address().port}/oauth2callback`;
        server.close();

        const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);
        const { tokens } = await client.getToken(code);
        resolve(tokens);
      } catch (error) {
        reject(error);
      }
    });

    server.listen(0, () => {
      const port = server.address().port;
      const redirectUri = `http://localhost:${port}/oauth2callback`;
      const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });
      console.log('\nOpen this URL in your browser to authorize access to Google Photos:\n');
      console.log(authUrl, '\n');
    });
  });
}

async function getAuthorizedClient() {
  const cached = await readTokenCache();
  if (cached) {
    const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
    client.setCredentials(cached);
    try {
      await client.getAccessToken();
      return client;
    } catch {
      console.log('Cached Google token is no longer valid, starting a new login...');
    }
  }

  const tokens = await runLoopbackOAuthFlow();
  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  client.setCredentials(tokens);
  await writeTokenCache(tokens);
  return client;
}

async function createAlbum(accessToken) {
  const res = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ album: { title: ALBUM_TITLE } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to create album: ${JSON.stringify(data)}`);
  return data.id;
}

async function uploadBytes(accessToken, buffer, filename) {
  const res = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-File-Name': filename,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload bytes for ${filename}: ${await res.text()}`);
  }
  return res.text();
}

async function addToAlbum(accessToken, albumId, uploadToken, filename) {
  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      newMediaItems: [
        { description: filename, simpleMediaItem: { uploadToken } },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to add media item: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log('Fetching guest photos from Vercel Blob...');
  const photos = await listPhotos();
  console.log('Fetching guest videos from Vercel Blob...');
  const videos = await listVideos();
  console.log(`Found ${photos.length} photo(s) and ${videos.length} video(s) to archive.\n`);

  if (photos.length === 0 && videos.length === 0) {
    console.log('Nothing to sync.');
    return;
  }

  const authClient = await getAuthorizedClient();
  const { token: accessToken } = await authClient.getAccessToken();

  console.log(`Creating Google Photos album "${ALBUM_TITLE}"...`);
  const albumId = await createAlbum(accessToken);

  let succeeded = 0;
  let failed = 0;
  const total = photos.length + videos.length;

  for (const photo of photos) {
    try {
      const res = await fetch(photo.url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `${photo.name.replace(/[^a-z0-9]+/gi, '-')}.jpg`;

      const uploadToken = await uploadBytes(accessToken, buffer, filename);
      await addToAlbum(accessToken, albumId, uploadToken, filename);

      succeeded += 1;
      console.log(`Archived (${succeeded}/${total}): ${photo.name}`);
    } catch (error) {
      failed += 1;
      console.error(`Failed to archive photo from ${photo.name}: ${error.message}`);
    }
  }

  for (const video of videos) {
    try {
      const res = await fetch(video.url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const extension = video.id.match(/\.([a-z0-9]+)$/i)?.[1] || 'mp4';
      const filename = `${video.name.replace(/[^a-z0-9]+/gi, '-')}.${extension}`;

      const uploadToken = await uploadBytes(accessToken, buffer, filename);
      await addToAlbum(accessToken, albumId, uploadToken, filename);

      succeeded += 1;
      console.log(`Archived (${succeeded}/${total}): ${video.name} (video)`);
    } catch (error) {
      failed += 1;
      console.error(`Failed to archive video from ${video.name}: ${error.message}`);
    }
  }

  console.log(`\nDone. ${succeeded} archived, ${failed} failed.`);
}

main().catch(error => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
