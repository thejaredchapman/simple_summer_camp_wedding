# Video Upload, Camp Sign Branding & Gradient Progress Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brand the guest upload pages with the Camp Javery sign and a gradient upload-progress bar, add a full guest video upload feature (`/upload-video`, `/videos` gallery, admin moderation, Google Photos archive) that stays completely separate from the photo slideshow, and add a "Contact Help" mailto link to the pages guests are most likely to need it on.

**Architecture:** Builds directly on the already-merged guest photo upload feature. A new `server/videoStorage.js` mirrors `server/photoStorage.js` for a `guest-videos/` Vercel Blob prefix (no database, same pathname-encoding pattern, but preserving the original file extension instead of forcing `.jpg`). New Express routes mirror the existing photo routes. On the frontend, a shared XHR-based upload helper and two new shared components (`UploadProgressBar`, `UploadSuccessScreen`) are built once and reused by both the existing photo upload page and the new video upload page. `/slideshow` is never touched — it structurally cannot see video data since it only ever imports from `photosApi.js`.

**Tech Stack:** Same as the existing feature — Express, `@vercel/blob`, `multer`, React 19, `react-router-dom`. No new dependencies required (video upload uses the browser's native `XMLHttpRequest` and `<video>` element).

## Global Constraints

- No client-side video compression — not realistically feasible in-browser. Videos upload as-is, capped at 250MB (client- and server-validated).
- Accepted video MIME types: `video/mp4`, `video/quicktime` (iOS `.mov`), `video/webm`, `video/3gpp`.
- `/slideshow` (`src/pages/SlideshowPage.jsx`) must not be modified in this plan and must not import anything from `videosApi.js` or `videoStorage.js` — videos are structurally excluded, not filtered.
- Video pathnames preserve the original file's extension (derived from MIME type) — unlike photos, which are always normalized to `.jpg` by client-side compression.
- No automated test framework in this repo (confirmed unchanged since the last plan) — every task's verification step is a manual command (`node -e`, `curl`) or browser check.
- Follow existing conventions: PascalCase `.jsx` + matching `.css`, pages in `src/pages/`, shared cross-page UI in `src/components/`, API clients in `src/lib/`.
- Gradient colors are fixed values sampled from `public/camp-sign.png`: gold `#E3B152`, orange `#E0773C`, red `#E44842`.
- `/upload` and `/upload-video` remain two separate pages/routes; they share the `UploadProgressBar` and `UploadSuccessScreen` components, not a single merged page.

---

## Task 1: Upload UI polish — camp sign, gradient progress bar, shared success screen

**Files:**
- Modify: `src/index.css` (add `--gradient-sunset` variable)
- Create: `src/lib/uploadWithProgress.js`
- Create: `src/components/UploadProgressBar.jsx`
- Create: `src/components/UploadProgressBar.css`
- Create: `src/components/UploadSuccessScreen.jsx`
- Create: `src/components/UploadSuccessScreen.css`
- Modify: `src/lib/photosApi.js` (`uploadPhoto` gains an `onProgress` callback, implemented via the new XHR helper)
- Modify: `src/pages/UploadPage.jsx`
- Modify: `src/pages/UploadPage.css`

**Interfaces:**
- Produces:
  - `src/lib/uploadWithProgress.js#uploadWithProgress(url: string, formData: FormData, onProgress?: (percent: number) => void): Promise<any>` — XHR-based multipart POST, resolves with parsed JSON body on 2xx, rejects with an `Error` carrying a friendly message otherwise.
  - `src/components/UploadProgressBar.jsx` — `<UploadProgressBar percent={number} />`
  - `src/components/UploadSuccessScreen.jsx` — `<UploadSuccessScreen guestName={string} mediaType={"photo"|"video"} onUploadAnother={() => void} />`
  - `src/lib/photosApi.js#uploadPhoto(guestName: string, file: File|Blob, onProgress?: (percent: number) => void): Promise<{success: true, url: string}>` (signature change: new optional third param; existing behavior for callers that omit it is unchanged)
- Consumes: existing `POST /api/photos/upload` endpoint (unchanged).

- [ ] **Step 1: Add the gradient CSS variable**

  In `src/index.css`, find this line inside the `:root` block:
  ```css
    --color-text-light: #4A7C59;
  ```
  Add immediately after it:
  ```css
    --color-text-light: #4A7C59;
    --gradient-sunset: linear-gradient(90deg, #E3B152 0%, #E0773C 50%, #E44842 100%);
  ```

- [ ] **Step 2: Write `src/lib/uploadWithProgress.js`**

  ```js
  export function uploadWithProgress(url, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
      }

      xhr.addEventListener('load', () => {
        let data;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = null;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data?.error || 'Something went wrong. Please try again.'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error. Please try again.'));
      });

      xhr.send(formData);
    });
  }
  ```

- [ ] **Step 3: Write `src/components/UploadProgressBar.jsx`**

  ```jsx
  import './UploadProgressBar.css';

  export default function UploadProgressBar({ percent }) {
    return (
      <div
        className="upload-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="upload-progress-mask" style={{ width: `${100 - percent}%` }} />
        <span className="upload-progress-label">{percent}%</span>
      </div>
    );
  }
  ```

  The gradient is painted as the fixed background of the whole track; a neutral mask covers the unfilled portion from the right and shrinks as `percent` grows — so early progress shows mostly gold, and the full gold→orange→red sweep only becomes visible near 100%. This is deliberate: do not implement this as a shrinking gradient-filled bar (that would show the gradient compressed/distorted rather than progressively revealed).

- [ ] **Step 4: Write `src/components/UploadProgressBar.css`**

  ```css
  .upload-progress-track {
    position: relative;
    width: 100%;
    height: 28px;
    border-radius: 999px;
    overflow: hidden;
    margin-top: var(--spacing-sm);
    background: var(--gradient-sunset);
  }

  .upload-progress-mask {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    background: var(--color-cream-dark);
    transition: width 0.2s ease;
  }

  .upload-progress-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text);
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
    z-index: 1;
  }
  ```

- [ ] **Step 5: Write `src/components/UploadSuccessScreen.jsx`**

  ```jsx
  import './UploadSuccessScreen.css';

  export default function UploadSuccessScreen({ guestName, mediaType, onUploadAnother }) {
    return (
      <div className="upload-success">
        <p>Thanks, {guestName}! Your {mediaType} is up.</p>
        <button type="button" onClick={onUploadAnother}>
          Upload another {mediaType}
        </button>
      </div>
    );
  }
  ```

- [ ] **Step 6: Write `src/components/UploadSuccessScreen.css`**

  ```css
  .upload-success {
    text-align: center;
  }

  .upload-success p {
    color: var(--color-text);
    font-size: 1.1rem;
    margin-bottom: var(--spacing-sm);
  }

  .upload-success button {
    margin-top: var(--spacing-md);
    padding: 0.9rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .upload-success button:hover {
    background: var(--color-secondary);
  }
  ```

- [ ] **Step 7: Update `src/lib/photosApi.js`'s `uploadPhoto` to use the XHR helper**

  Add the import at the top of the file:
  ```js
  import { uploadWithProgress } from './uploadWithProgress';
  ```

  Replace the existing `uploadPhoto` function:
  ```js
  export async function uploadPhoto(guestName, file) {
    const formData = new FormData();
    formData.append('guestName', guestName);
    formData.append('photo', file);

    const res = await fetch(`${BACKEND_URL}/api/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return res.json();
  }
  ```
  with:
  ```js
  export async function uploadPhoto(guestName, file, onProgress) {
    const formData = new FormData();
    formData.append('guestName', guestName);
    formData.append('photo', file);
    return uploadWithProgress(`${BACKEND_URL}/api/photos/upload`, formData, onProgress);
  }
  ```

  Leave `listPhotos`, `adminListPhotos`, and `adminDeletePhoto` untouched — they still use `fetch` directly (no upload progress needed for reads/deletes).

- [ ] **Step 8: Rewrite `src/pages/UploadPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { compressPhoto } from '../lib/compressImage';
  import { uploadPhoto } from '../lib/photosApi';
  import UploadProgressBar from '../components/UploadProgressBar';
  import UploadSuccessScreen from '../components/UploadSuccessScreen';
  import './UploadPage.css';

  export default function UploadPage() {
    const [guestName, setGuestName] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [progress, setProgress] = useState(0);

    async function handleSubmit(e) {
      e.preventDefault();
      if (!guestName.trim() || !file) return;
      await attemptUpload(1);
    }

    async function attemptUpload(attempt) {
      setStatus('uploading');
      setErrorMessage('');
      setProgress(0);
      try {
        const compressed = await compressPhoto(file);
        await uploadPhoto(guestName.trim(), compressed, setProgress);
        setStatus('success');
      } catch (error) {
        if (attempt < 2) {
          return attemptUpload(attempt + 1);
        }
        setStatus('error');
        setErrorMessage(error.message || 'Upload failed. Please try again.');
      }
    }

    function handleUploadAnother() {
      setStatus('idle');
      setFile(null);
      setProgress(0);
    }

    return (
      <div className="upload-page">
        <div className="upload-card">
          <img src="/camp-sign.png" alt="Camp Javery" className="upload-card-sign" />
          <h1>Share Your Photos!</h1>
          <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

          {status === 'success' ? (
            <UploadSuccessScreen
              guestName={guestName}
              mediaType="photo"
              onUploadAnother={handleUploadAnother}
            />
          ) : (
            <form onSubmit={handleSubmit} className="upload-form">
              <label htmlFor="guestName">Your name</label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                maxLength={60}
                required
                disabled={status === 'uploading'}
              />

              <label htmlFor="photo">Photo</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                disabled={status === 'uploading'}
              />

              {status === 'uploading' && <UploadProgressBar percent={progress} />}

              {status === 'error' && (
                <p className="upload-error" role="alert">{errorMessage}</p>
              )}

              <button type="submit" disabled={status === 'uploading' || !guestName.trim() || !file}>
                {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 9: Update `src/pages/UploadPage.css`**

  Add near the top (after `.upload-page` / before or after `.upload-card`):
  ```css
  .upload-card-sign {
    max-width: 180px;
    width: 100%;
    height: auto;
    margin: 0 auto var(--spacing-sm);
    display: block;
  }
  ```

  Replace this block (the success screen styling now lives in `UploadSuccessScreen.css`):
  ```css
  .upload-form button,
  .upload-success button {
    margin-top: var(--spacing-md);
    padding: 0.9rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .upload-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-form button:not(:disabled):hover,
  .upload-success button:hover {
    background: var(--color-secondary);
  }

  .upload-error {
    color: var(--color-warm-sunset-4);
    font-weight: 600;
  }

  .upload-success p {
    color: var(--color-text);
    font-size: 1.1rem;
    margin-bottom: var(--spacing-sm);
  }
  ```
  with:
  ```css
  .upload-form button {
    margin-top: var(--spacing-md);
    padding: 0.9rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .upload-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-form button:not(:disabled):hover {
    background: var(--color-secondary);
  }

  .upload-error {
    color: var(--color-warm-sunset-4);
    font-weight: 600;
  }
  ```

- [ ] **Step 10: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload`. Confirm the camp sign appears above the heading. Submit a real photo upload and confirm: the progress bar appears during upload, the percentage counts up, the visible gradient color shifts from mostly-gold early to the full gold→orange→red sweep near completion, and the success screen shows "Thanks, {name}! Your photo is up." with an "Upload another photo" button that resets the form.

- [ ] **Step 11: Commit**

  ```bash
  git add src/index.css src/lib/uploadWithProgress.js src/components/UploadProgressBar.jsx src/components/UploadProgressBar.css src/components/UploadSuccessScreen.jsx src/components/UploadSuccessScreen.css src/lib/photosApi.js src/pages/UploadPage.jsx src/pages/UploadPage.css
  git commit -m "Add camp sign branding, gradient upload progress bar, and shared success screen"
  ```

---

## Task 2: Video storage module (Vercel Blob)

**Files:**
- Create: `server/videoStorage.js`

**Interfaces:**
- Produces:
  - `buildVideoPathname(guestName: string, contentType: string): string`
  - `parseVideoPathname(pathname: string): { name: string }`
  - `uploadVideo(buffer: Buffer, guestName: string, contentType: string): Promise<{ url: string, pathname: string }>`
  - `listVideos(): Promise<Array<{ id: string, url: string, name: string, uploadedAt: string }>>`
  - `deleteVideo(pathname: string): Promise<void>`
- Consumes: `@vercel/blob`'s `put`, `list`, `del` (already installed, used by `photoStorage.js`).

- [ ] **Step 1: Write `server/videoStorage.js`**

  ```js
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
  ```

- [ ] **Step 2: Verify pathname encode/decode round-trips, including extension preservation**

  Run:
  ```bash
  cd server && node -e "
  import('./videoStorage.js').then(({ buildVideoPathname, parseVideoPathname }) => {
    const movPathname = buildVideoPathname(\"Avery O'Brien\", 'video/quicktime');
    console.log('mov pathname:', movPathname);
    if (!movPathname.endsWith('.mov')) throw new Error('expected .mov extension: ' + movPathname);
    const { name } = parseVideoPathname(movPathname);
    if (name !== \"Avery O'Brien\") throw new Error('round-trip failed: ' + name);

    const mp4Pathname = buildVideoPathname('Test Guest', 'video/mp4');
    if (!mp4Pathname.endsWith('.mp4')) throw new Error('expected .mp4 extension: ' + mp4Pathname);

    console.log('OK');
  });
  "
  ```
  Expected output ends with `OK`.

- [ ] **Step 3: Verify live upload/list/delete against the real Blob store**

  Run:
  ```bash
  cd server && node -e "
  import('dotenv/config').then(async () => {
    const { uploadVideo, listVideos, deleteVideo } = await import('./videoStorage.js');
    const blob = await uploadVideo(Buffer.from('test'), 'Test Guest', 'video/mp4');
    console.log('uploaded:', blob.url, blob.pathname);
    const videos = await listVideos();
    if (!videos.some(v => v.id === blob.pathname)) throw new Error('uploaded blob missing from list');
    await deleteVideo(blob.pathname);
    const after = await listVideos();
    if (after.some(v => v.id === blob.pathname)) throw new Error('blob still present after delete');
    console.log('OK');
  });
  "
  ```
  Requires `server/.env` to already have `BLOB_READ_WRITE_TOKEN` set (already configured from the prior plan). Expected output ends with `OK`.

- [ ] **Step 4: Commit**

  ```bash
  git add server/videoStorage.js
  git commit -m "Add video storage module for guest video uploads"
  ```

---

## Task 3: Guest video upload endpoint

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `uploadVideo` from `./videoStorage.js` (Task 2); existing `sanitizeInput`, `createRateLimiter`.
- Produces: `POST /api/videos/upload` — multipart fields `guestName` (text) and `video` (file) → `{ success: true, url: string }` on 200, `{ error: string }` on 4xx/5xx.

- [ ] **Step 1: Add the import and route**

  Add near the other imports:
  ```js
  import { uploadVideo, listVideos, deleteVideo } from './videoStorage.js';
  ```

  Add near the other rate limiter instances (after `adminRateLimiter`):
  ```js
  const videoUploadRateLimiter = createRateLimiter(10 * 60 * 1000, 5); // 5 uploads / 10 min / IP
  ```

  Add in the ROUTES section, after the `/api/photos/upload` route:
  ```js
  const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
  });

  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];

  app.post('/api/videos/upload', videoUploadRateLimiter, (req, res, next) => {
    videoUpload.single('video')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'That video is too large (max 250MB). Please try a shorter clip.' });
        }
        console.error('Video upload parsing error:', err.message);
        return res.status(400).json({ error: 'Upload failed. Please try again.' });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const guestName = sanitizeInput(req.body.guestName || '').slice(0, 60);
      if (!guestName) {
        return res.status(400).json({ error: 'Please enter your name.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No video was uploaded.' });
      }
      if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only video files are allowed.' });
      }

      const blob = await uploadVideo(req.file.buffer, guestName, req.file.mimetype);
      res.json({ success: true, url: blob.url });
    } catch (error) {
      console.error('Video upload error:', error.message);
      res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  });
  ```

  (`listVideos`/`deleteVideo` are imported now but only used starting in Tasks 4/5 — that's expected, not dead code, since this file is built incrementally across tasks like the photo endpoints were.)

- [ ] **Step 2: Verify the server boots and the upload endpoint works**

  ```bash
  cd server && npm run dev
  ```
  In another terminal, create a small dummy video-like file and upload it (the server only checks MIME type via multer's detection of the `Content-Type` part in the multipart body, not real video validity, so a small file with the right declared type is sufficient for this check):
  ```bash
  curl -i -F "guestName=Test Guest" -F "video=@public/camp-sign.png;type=video/mp4;filename=test.mp4" http://localhost:3001/api/videos/upload
  ```
  Expected: `200` with `{"success":true,"url":"https://..."}`. Open the returned URL and confirm it's reachable (the content itself will just be the PNG bytes with a video content-type — that's fine, this step only verifies the upload pipeline, not real video playback, which Task 7's browser verification covers with an actual video file).

  Then verify validation:
  ```bash
  curl -i -F "guestName=Test Guest" -F "video=@public/camp-sign.png;type=image/png;filename=test.png" http://localhost:3001/api/videos/upload
  ```
  Expected: `400` with `{"error":"Only video files are allowed."}`.

- [ ] **Step 3: Commit**

  ```bash
  git add server/index.js
  git commit -m "Add guest video upload endpoint with rate limiting"
  ```

---

## Task 4: Public video listing endpoint

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `listVideos` from `./videoStorage.js` (Task 2, already imported in Task 3).
- Produces: `GET /api/videos` → `{ videos: Array<{ id: string, url: string, name: string, uploadedAt: string }> }`.

- [ ] **Step 1: Add the route**

  Add near the other rate limiter instances:
  ```js
  const videoListRateLimiter = createRateLimiter(60 * 1000, 300); // 300 requests / min / IP
  ```

  Add the route, after `/api/videos/upload`:
  ```js
  app.get('/api/videos', videoListRateLimiter, async (req, res) => {
    try {
      const videos = await listVideos();
      res.json({ videos });
    } catch (error) {
      console.error('List videos error:', error.message);
      res.status(500).json({ error: 'Unable to load videos right now.' });
    }
  });
  ```

- [ ] **Step 2: Verify**

  ```bash
  cd server && npm run dev
  ```
  ```bash
  curl -s http://localhost:3001/api/videos
  ```
  Expected: `200` with a `videos` array containing the test video from Task 3's verification (if you haven't deleted it yet — either way, confirm the shape: `id`, `url`, `name`, `uploadedAt`).

- [ ] **Step 3: Commit**

  ```bash
  git add server/index.js
  git commit -m "Add public video listing endpoint"
  ```

---

## Task 5: Admin video moderation endpoints

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `listVideos`, `deleteVideo` from `./videoStorage.js` (Task 2); existing `requireAdmin` middleware, `adminRateLimiter`.
- Produces:
  - `GET /api/admin/videos` → `{ videos: Array<{id,url,name,uploadedAt}> }` (401 if password missing/wrong).
  - `DELETE /api/admin/videos?id=<encoded pathname>` → `{ success: true }` (401 if password missing/wrong, 400 if `id` missing/invalid).

- [ ] **Step 1: Add the routes**

  Add, after the existing `/api/admin/photos` DELETE route:
  ```js
  app.get('/api/admin/videos', adminRateLimiter, requireAdmin, async (req, res) => {
    try {
      const videos = await listVideos();
      res.json({ videos });
    } catch (error) {
      console.error('Admin list videos error:', error.message);
      res.status(500).json({ error: 'Unable to load videos right now.' });
    }
  });

  app.delete('/api/admin/videos', adminRateLimiter, requireAdmin, async (req, res) => {
    try {
      const pathname = req.query.id;
      if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-videos/')) {
        return res.status(400).json({ error: 'Invalid video id.' });
      }
      await deleteVideo(pathname);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete video error:', error.message);
      res.status(500).json({ error: 'Unable to delete video.' });
    }
  });
  ```

  Note the `guest-videos/` prefix guard (parallel to the photo route's `guest-photos/` guard) — this is what prevents the delete endpoint from being used to remove blobs outside the video prefix.

- [ ] **Step 2: Verify auth rejection and authenticated list/delete**

  ```bash
  cd server && npm run dev
  ```
  ```bash
  curl -i http://localhost:3001/api/admin/videos
  ```
  Expected: `401` with `{"error":"Incorrect admin password."}`.

  Read the real password via dotenv (do not read the raw `.env` file line directly — it's wrapped in literal quote characters that only `dotenv` strips correctly):
  ```bash
  node -e "require('dotenv').config(); console.log(process.env.ADMIN_PASSWORD.length)"
  ```
  Use that password (from `server/.env`, opened in an editor if needed) in:
  ```bash
  curl -s -H "x-admin-password: YOUR_ACTUAL_PASSWORD" http://localhost:3001/api/admin/videos
  ```
  Expected: `200` with a `videos` array. Copy one video's `id`, then:
  ```bash
  curl -i -X DELETE -H "x-admin-password: YOUR_ACTUAL_PASSWORD" \
    "http://localhost:3001/api/admin/videos?id=$(node -e "console.log(encodeURIComponent('PASTE_ID_HERE'))")"
  ```
  Expected: `200` with `{"success":true}`. Re-run the list request and confirm that video is gone.

- [ ] **Step 3: Commit**

  ```bash
  git add server/index.js
  git commit -m "Add password-protected admin video moderation endpoints"
  ```

---

## Task 6: Frontend video API client

**Files:**
- Create: `src/lib/videosApi.js`

**Interfaces:**
- Consumes: `uploadWithProgress` from `./uploadWithProgress.js` (Task 1); `POST /api/videos/upload`, `GET /api/videos`, `GET /api/admin/videos`, `DELETE /api/admin/videos` (Tasks 3–5).
- Produces:
  - `uploadVideo(guestName: string, file: File, onProgress?: (percent: number) => void): Promise<{success: true, url: string}>`
  - `listVideos(): Promise<Array<{id,url,name,uploadedAt}>>`
  - `adminListVideos(password: string): Promise<Array<{id,url,name,uploadedAt}>>`
  - `adminDeleteVideo(id: string, password: string): Promise<void>`

- [ ] **Step 1: Write `src/lib/videosApi.js`**

  ```js
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
  ```

- [ ] **Step 2: Verify with a quick manual smoke check**

  With the backend running (`cd server && npm run dev`), from the repo root, run a small script exercising the module against the real backend:
  ```bash
  node -e "
  import('./src/lib/videosApi.js').then(async ({ uploadVideo, listVideos }) => {
    // Node doesn't have FormData/File/fetch identical to the browser in all versions,
    // so this is a lightweight import/shape check rather than a full upload —
    // full upload verification happens via the browser in Task 7.
    console.log('uploadVideo is a function:', typeof uploadVideo === 'function');
    console.log('listVideos is a function:', typeof listVideos === 'function');
  });
  "
  ```
  Expected: both print `true`. Full functional verification (real upload with progress) happens in Task 7 once `UploadVideoPage` exists to exercise it end-to-end in the browser.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/videosApi.js
  git commit -m "Add frontend video API client"
  ```

---

## Task 7: Video upload page

**Files:**
- Create: `src/pages/UploadVideoPage.jsx`
- Create: `src/pages/UploadVideoPage.css`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `uploadVideo` from `src/lib/videosApi.js` (Task 6); `UploadProgressBar`, `UploadSuccessScreen` from `src/components/` (Task 1).
- Produces: `/upload-video` route.

- [ ] **Step 1: Write `src/pages/UploadVideoPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { uploadVideo } from '../lib/videosApi';
  import UploadProgressBar from '../components/UploadProgressBar';
  import UploadSuccessScreen from '../components/UploadSuccessScreen';
  import './UploadVideoPage.css';

  const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;

  export default function UploadVideoPage() {
    const [guestName, setGuestName] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [progress, setProgress] = useState(0);

    function handleFileChange(e) {
      const selected = e.target.files?.[0] || null;
      if (selected && selected.size > MAX_VIDEO_SIZE_BYTES) {
        setStatus('error');
        setErrorMessage('That video is too large (max 250MB). Please try a shorter clip.');
        setFile(null);
        return;
      }
      setStatus('idle');
      setErrorMessage('');
      setFile(selected);
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!guestName.trim() || !file) return;
      await attemptUpload(1);
    }

    async function attemptUpload(attempt) {
      setStatus('uploading');
      setErrorMessage('');
      setProgress(0);
      try {
        await uploadVideo(guestName.trim(), file, setProgress);
        setStatus('success');
      } catch (error) {
        if (attempt < 2) {
          return attemptUpload(attempt + 1);
        }
        setStatus('error');
        setErrorMessage(error.message || 'Upload failed. Please try again.');
      }
    }

    function handleUploadAnother() {
      setStatus('idle');
      setFile(null);
      setProgress(0);
    }

    return (
      <div className="upload-page">
        <div className="upload-card">
          <img src="/camp-sign.png" alt="Camp Javery" className="upload-card-sign" />
          <h1>Share Your Videos!</h1>
          <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

          {status === 'success' ? (
            <UploadSuccessScreen
              guestName={guestName}
              mediaType="video"
              onUploadAnother={handleUploadAnother}
            />
          ) : (
            <form onSubmit={handleSubmit} className="upload-form">
              <label htmlFor="guestName">Your name</label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                maxLength={60}
                required
                disabled={status === 'uploading'}
              />

              <label htmlFor="video">Video</label>
              <input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                required
                disabled={status === 'uploading'}
              />

              {status === 'uploading' && <UploadProgressBar percent={progress} />}

              {status === 'error' && (
                <p className="upload-error" role="alert">{errorMessage}</p>
              )}

              <button type="submit" disabled={status === 'uploading' || !guestName.trim() || !file}>
                {status === 'uploading' ? 'Uploading…' : 'Upload Video'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `src/pages/UploadVideoPage.css`**

  ```css
  .upload-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-cream);
    padding: var(--spacing-md);
  }

  .upload-card {
    background: white;
    border-radius: 12px;
    padding: var(--spacing-lg) var(--spacing-md);
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .upload-card-sign {
    max-width: 180px;
    width: 100%;
    height: auto;
    margin: 0 auto var(--spacing-sm);
    display: block;
  }

  .upload-card h1 {
    font-family: var(--font-display);
    color: var(--color-primary);
    margin-bottom: var(--spacing-xs);
  }

  .upload-subtitle {
    color: var(--color-text-light);
    margin-bottom: var(--spacing-md);
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    text-align: left;
  }

  .upload-form label {
    font-weight: 600;
    color: var(--color-text);
    margin-top: var(--spacing-sm);
  }

  .upload-form input[type='text'],
  .upload-form input[type='file'] {
    padding: 0.75rem;
    border: 1px solid var(--color-cream-dark);
    border-radius: 8px;
    font-size: 1rem;
  }

  .upload-form button {
    margin-top: var(--spacing-md);
    padding: 0.9rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .upload-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-form button:not(:disabled):hover {
    background: var(--color-secondary);
  }

  .upload-error {
    color: var(--color-warm-sunset-4);
    font-weight: 600;
  }
  ```

  (This intentionally duplicates most of `UploadPage.css` rather than sharing a stylesheet — matches this repo's existing convention of each page owning its own CSS file, as already established across `GalleryPage.css`, `AdminPage.css`, etc.)

- [ ] **Step 3: Wire the route in `src/App.jsx`**

  Add the import:
  ```jsx
  import UploadVideoPage from './pages/UploadVideoPage';
  ```
  Add the route (anywhere among the existing `<Route>` entries, e.g. right after `/upload`):
  ```jsx
  <Route path="/upload-video" element={<UploadVideoPage />} />
  ```

- [ ] **Step 4: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload-video`. Confirm the camp sign and heading render. Upload a real video file (any short clip you have locally, or record one on your phone and use LAN IP / a tunnel as in the original feature's local-testing docs). Confirm: the file picker only offers video files, the progress bar behaves the same as the photo page's (gradient reveal, percentage), and the success screen says "Thanks, {name}! Your video is up." with an "Upload another video" button.

  Then verify the size rejection path: try selecting a file you know is over 250MB (or temporarily lower `MAX_VIDEO_SIZE_BYTES` locally to test with a smaller file, then revert — do not commit a temporary lowered value). Confirm the friendly error appears immediately, with no network request attempted (check the browser's network tab).

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/UploadVideoPage.jsx src/pages/UploadVideoPage.css src/App.jsx
  git commit -m "Add guest video upload page"
  ```

---

## Task 8: Videos gallery page

**Files:**
- Create: `src/pages/VideosPage.jsx`
- Create: `src/pages/VideosPage.css`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `listVideos` from `src/lib/videosApi.js` (Task 6).
- Produces: `/videos` route.

- [ ] **Step 1: Write `src/pages/VideosPage.jsx`**

  ```jsx
  import { useEffect, useState } from 'react';
  import { listVideos } from '../lib/videosApi';
  import './VideosPage.css';

  const POLL_INTERVAL_MS = 20000;

  export default function VideosPage() {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
      let cancelled = false;

      async function fetchVideos() {
        try {
          const data = await listVideos();
          if (!cancelled) {
            setVideos(data);
            setError('');
          }
        } catch (err) {
          if (!cancelled) setError(err.message);
        }
      }

      fetchVideos();
      const interval = setInterval(fetchVideos, POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, []);

    return (
      <div className="videos-page">
        <h1>Camp Javery Videos</h1>
        {error && <p className="videos-error">{error}</p>}
        <div className="videos-grid">
          {videos.map(video => (
            <div key={video.id} className="videos-item">
              <video src={video.url} controls preload="metadata" />
              <span className="videos-item-name">{video.name}</span>
            </div>
          ))}
        </div>
        {videos.length === 0 && !error && (
          <p className="videos-empty">No videos yet — be the first to share one!</p>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `src/pages/VideosPage.css`**

  ```css
  .videos-page {
    min-height: 100vh;
    background: var(--color-cream);
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .videos-page h1 {
    font-family: var(--font-display);
    color: var(--color-primary);
    text-align: center;
    margin-bottom: var(--spacing-md);
  }

  .videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--spacing-sm);
    max-width: 1100px;
    margin: 0 auto;
  }

  .videos-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .videos-item video {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    background: black;
  }

  .videos-item-name {
    display: block;
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    color: var(--color-text);
  }

  .videos-error,
  .videos-empty {
    text-align: center;
    color: var(--color-text-light);
  }
  ```

- [ ] **Step 3: Wire the route in `src/App.jsx`**

  Add the import:
  ```jsx
  import VideosPage from './pages/VideosPage';
  ```
  Add the route:
  ```jsx
  <Route path="/videos" element={<VideosPage />} />
  ```

- [ ] **Step 4: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/videos`. Confirm the video(s) uploaded in Task 7's verification appear in a grid with playable native controls and guest names. Upload another video from `/upload-video` in a second tab and confirm it appears within ~20 seconds without a manual refresh.

  Then open `http://localhost:5173/slideshow` and confirm it still only shows photos — no video ever appears there, and there are no console errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/VideosPage.jsx src/pages/VideosPage.css src/App.jsx
  git commit -m "Add videos gallery page"
  ```

---

## Task 9: Admin video moderation section

**Files:**
- Modify: `src/pages/AdminPage.jsx`
- Modify: `src/pages/AdminPage.css`

**Interfaces:**
- Consumes: `adminListVideos`, `adminDeleteVideo` from `src/lib/videosApi.js` (Task 6).
- Produces: no new route — extends the existing `/admin` page with a second "Video Moderation" section.

- [ ] **Step 1: Rewrite `src/pages/AdminPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { adminListPhotos, adminDeletePhoto } from '../lib/photosApi';
  import { adminListVideos, adminDeleteVideo } from '../lib/videosApi';
  import './AdminPage.css';

  export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        const [photoData, videoData] = await Promise.all([
          adminListPhotos(password),
          adminListVideos(password),
        ]);
        setPhotos(photoData);
        setVideos(videoData);
        setAuthed(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function handleDeletePhoto(id) {
      if (!window.confirm('Delete this photo?')) return;
      try {
        await adminDeletePhoto(id, password);
        setPhotos(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }

    async function handleDeleteVideo(id) {
      if (!window.confirm('Delete this video?')) return;
      try {
        await adminDeleteVideo(id, password);
        setVideos(prev => prev.filter(v => v.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }

    if (!authed) {
      return (
        <div className="admin-page">
          <form onSubmit={handleLogin} className="admin-login">
            <h1>Admin</h1>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              required
            />
            {error && <p className="admin-error" role="alert">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="admin-page">
        <h1>Photo Moderation</h1>
        <p className="admin-stats">
          {photos.length} photo{photos.length === 1 ? '' : 's'} uploaded
        </p>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-grid">
          {photos.map(photo => (
            <div key={photo.id} className="admin-item">
              <img src={photo.url} alt={`Photo from ${photo.name}`} />
              <p>{photo.name}</p>
              <button type="button" onClick={() => handleDeletePhoto(photo.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <h1>Video Moderation</h1>
        <p className="admin-stats">
          {videos.length} video{videos.length === 1 ? '' : 's'} uploaded
        </p>
        <div className="admin-grid">
          {videos.map(video => (
            <div key={video.id} className="admin-item">
              <video src={video.url} controls preload="metadata" />
              <p>{video.name}</p>
              <button type="button" onClick={() => handleDeleteVideo(video.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

  Note: this renames the previous `handleDelete` to `handleDeletePhoto` for clarity now that there are two delete handlers — this is a controlled rename within a file already being rewritten in full, not a stray change.

- [ ] **Step 2: Update `src/pages/AdminPage.css`**

  Add after the existing `.admin-item img` rule:
  ```css
  .admin-item video {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
    background: black;
  }
  ```

  Add spacing between the two sections (after the existing `.admin-grid` rule):
  ```css
  .admin-page h1 + .admin-stats {
    margin-top: 0;
  }

  .admin-grid + h1 {
    margin-top: var(--spacing-lg);
  }
  ```

- [ ] **Step 3: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/admin`, log in. Confirm both "Photo Moderation" and "Video Moderation" sections appear with correct counts. Delete a video and confirm it disappears from the admin grid, `/videos`, and (unaffected) that `/slideshow` still shows no videos. Confirm deleting a photo still works exactly as before (regression check on existing functionality).

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/AdminPage.jsx src/pages/AdminPage.css
  git commit -m "Add video moderation section to admin page"
  ```

---

## Task 10: Extend the Google Photos archive script to include videos

**Files:**
- Modify: `scripts/sync-to-google-photos.js`

**Interfaces:**
- Consumes: `listVideos` from `server/videoStorage.js` (Task 2).
- Produces: the script now archives both photos and videos into the same "Camp Javery Wedding" album.

- [ ] **Step 1: Update the imports**

  Replace:
  ```js
  const { listPhotos } = await import('../server/photoStorage.js');
  ```
  with:
  ```js
  const { listPhotos } = await import('../server/photoStorage.js');
  const { listVideos } = await import('../server/videoStorage.js');
  ```

- [ ] **Step 2: Update `main()` to fetch and archive both**

  Replace the entire `main()` function:
  ```js
  async function main() {
    console.log('Fetching guest photos from Vercel Blob...');
    const photos = await listPhotos();
    console.log(`Found ${photos.length} photo(s) to archive.\n`);

    if (photos.length === 0) {
      console.log('Nothing to sync.');
      return;
    }

    const authClient = await getAuthorizedClient();
    const { token: accessToken } = await authClient.getAccessToken();

    console.log(`Creating Google Photos album "${ALBUM_TITLE}"...`);
    const albumId = await createAlbum(accessToken);

    let succeeded = 0;
    let failed = 0;

    for (const photo of photos) {
      try {
        const res = await fetch(photo.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const filename = `${photo.name.replace(/[^a-z0-9]+/gi, '-')}.jpg`;

        const uploadToken = await uploadBytes(accessToken, buffer, filename);
        await addToAlbum(accessToken, albumId, uploadToken, filename);

        succeeded += 1;
        console.log(`Archived (${succeeded}/${photos.length}): ${photo.name}`);
      } catch (error) {
        failed += 1;
        console.error(`Failed to archive photo from ${photo.name}: ${error.message}`);
      }
    }

    console.log(`\nDone. ${succeeded} archived, ${failed} failed.`);
  }
  ```
  with:
  ```js
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
  ```

  The per-item try/catch stays inside each loop (not around the whole loop), preserving the existing behavior where one item's failure doesn't abort the rest of the run.

- [ ] **Step 3: Verify what's verifiable without live Google credentials**

  ```bash
  node --check scripts/sync-to-google-photos.js
  ```
  Expected: no output (syntax OK). If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are not yet configured in `server/.env` (same constraint as when this script was first built), live end-to-end verification (real OAuth consent, real album creation, real photo+video upload) is not possible in this environment and needs a human pass once those credentials exist — note this explicitly rather than skipping the check silently. If credentials ARE already configured (check with `grep -c '^GOOGLE_CLIENT_ID=' server/.env`), run the script for real with at least one test photo and one test video already uploaded, and confirm the album ends up containing both.

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/sync-to-google-photos.js
  git commit -m "Extend Google Photos archive script to include guest videos"
  ```

---

## Task 11: Documentation updates

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `TESTING_GUIDE.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Update `README.md`**

  In the existing "Guest Photo Upload Feature" section (added by the prior plan), add a new subsection after "QR Code for Guests" and before "Post-Wedding Google Photos Archive":

  ```markdown
  ### Guest Video Uploads

  Guests can also share short videos at `/upload-video` (a separate link from
  `/upload` — print or share both QR codes if you want guests to have easy
  access to each). Videos:

  - Are capped at 250MB per upload (roughly a few minutes of phone video) —
    there's no way to compress video in the browser the way photos are
    compressed, so guests with longer clips will need to trim them first.
  - Accept common phone formats: `.mp4` and `.mov` (iPhone), `.webm`.
  - Appear in a dedicated gallery at `/videos` — **not** in `/slideshow`,
    which stays photos-only by design.
  - Are moderated from the same `/admin` page as photos, in a separate
    "Video Moderation" section below the photo grid.

  Generate a QR code for the video upload link the same way as the photo one:
  ```bash
  node scripts/generate-qr.js https://your-deployed-domain.com/upload-video
  ```
  ```

  Update the existing "Post-Wedding Google Photos Archive" section's step 4 description to mention videos are now included too — change:
  ```markdown
  4. Open the printed URL, sign in with the Google account you want the album
     created in, and approve access. The script creates a "Camp Javery Wedding"
     album and uploads every guest photo into it.
  ```
  to:
  ```markdown
  4. Open the printed URL, sign in with the Google account you want the album
     created in, and approve access. The script creates a "Camp Javery Wedding"
     album and uploads every guest photo and video into it.
  ```

- [ ] **Step 2: Update `CLAUDE.md`**

  In the Architecture section's route list (added by the prior plan), add `/upload-video` and `/videos` to the list of routes, and add the four video API endpoints (`POST /api/videos/upload`, `GET /api/videos`, `GET /api/admin/videos`, `DELETE /api/admin/videos`) to the list of backend endpoints, alongside the existing photo ones. Mention `server/videoStorage.js` alongside `server/photoStorage.js` as the two Blob-backed storage modules (no database, metadata encoded in pathnames — videos additionally preserve their original file extension).

- [ ] **Step 3: Add a testing section to `TESTING_GUIDE.md`**

  Insert a new numbered section after the existing "10. Guest Photo Upload Testing" section (renumber if a differently-numbered section already follows, to keep the list sequential):

  ```markdown
  ### 11. Guest Video Upload Testing (10 minutes)

  #### Upload Flow
  - [ ] Open `/upload-video` — confirm the camp sign appears and the page
        only accepts video files
  - [ ] Upload a video recorded on an iPhone (native `.mov`) — confirm it
        uploads successfully and plays back correctly in `/videos`
  - [ ] Upload a video recorded on an Android phone (native `.mp4`) —
        confirm the same
  - [ ] Watch the progress bar during a real upload — confirm the percentage
        counts up accurately and the gradient visibly shifts from gold
        toward red as it approaches 100%
  - [ ] Try selecting a file over 250MB — confirm it's rejected immediately
        with a clear message, before any upload starts
  - [ ] Confirm the success screen says "Your video is up" (not "photo")

  #### Videos Gallery & Slideshow Isolation
  - [ ] Open `/videos` — confirm uploaded videos appear with working native
        playback controls
  - [ ] Upload a new video from another tab — confirm it appears in
        `/videos` within ~20 seconds without a manual refresh
  - [ ] Open `/slideshow` — confirm no video ever appears there, only
        photos, and there are no console errors

  #### Admin Moderation
  - [ ] Log into `/admin` — confirm both "Photo Moderation" and "Video
        Moderation" sections appear with correct counts
  - [ ] Delete a video from admin — confirm it disappears from `/videos`
        and the admin grid
  - [ ] Confirm deleting a photo still works correctly (no regression from
        adding the video section)
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add README.md CLAUDE.md TESTING_GUIDE.md
  git commit -m "Document video upload feature, testing checklist, and archive script changes"
  ```

---

## Task 12: Contact help link

**Files:**
- Create: `src/components/ContactHelpLink.jsx`
- Create: `src/components/ContactHelpLink.css`
- Modify: `src/pages/UploadPage.jsx`
- Modify: `src/pages/UploadVideoPage.jsx`
- Modify: `src/pages/GalleryPage.jsx`
- Modify: `src/pages/VideosPage.jsx`
- Modify: `src/pages/AdminPage.jsx`
- Modify: `README.md`

**Interfaces:**
- Produces: `src/components/ContactHelpLink.jsx` — `<ContactHelpLink />`, no props. Renders a plain `mailto:` link, no backend calls.
- Consumes: nothing — purely client-side.

- [ ] **Step 1: Write `src/components/ContactHelpLink.jsx`**

  ```jsx
  import './ContactHelpLink.css';

  const CONTACT_EMAIL = 'javery.chapmanwine@gmail.com';
  const SUBJECT = 'Issues uploading photos';
  const BODY = "Hi Jared,\n\nI'm having trouble with:\n\n\n\nPlease include your name so you know who's reaching out:\nMy name is: ";

  const MAILTO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

  export default function ContactHelpLink() {
    return (
      <a href={MAILTO_HREF} className="contact-help-link">
        Contact Help
      </a>
    );
  }
  ```

- [ ] **Step 2: Write `src/components/ContactHelpLink.css`**

  ```css
  .contact-help-link {
    position: fixed;
    bottom: var(--spacing-sm);
    right: var(--spacing-sm);
    background: white;
    color: var(--color-text-light);
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    font-size: 0.8rem;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    transition: color var(--transition-fast);
  }

  .contact-help-link:hover {
    color: var(--color-primary);
  }
  ```

- [ ] **Step 3: Wire into `src/pages/UploadPage.jsx`**

  Add the import alongside the other component imports:
  ```jsx
  import ContactHelpLink from '../components/ContactHelpLink';
  ```

  Add `<ContactHelpLink />` just before the outermost closing `</div>` (after the `.upload-card` div closes):
  ```jsx
          </div>
          <ContactHelpLink />
        </div>
      );
    }
  ```
  (i.e. insert it as a sibling of `.upload-card`, inside `.upload-page`.)

- [ ] **Step 4: Wire into `src/pages/UploadVideoPage.jsx`**

  Same pattern as Step 3 — add the import and place `<ContactHelpLink />` as a sibling of `.upload-card`, inside `.upload-page`.

- [ ] **Step 5: Wire into `src/pages/GalleryPage.jsx`**

  Add the import alongside the existing `listPhotos` import.

  Add `<ContactHelpLink />` just before the outermost closing `</div>`:
  ```jsx
        {photos.length === 0 && !error && (
          <p className="gallery-empty">No photos yet — be the first to share one!</p>
        )}
        <ContactHelpLink />
      </div>
    );
  }
  ```

- [ ] **Step 6: Wire into `src/pages/VideosPage.jsx`**

  Same pattern as Step 5 — add the import and place `<ContactHelpLink />` just before the outermost closing `</div>`, after the empty-state paragraph.

- [ ] **Step 7: Wire into `src/pages/AdminPage.jsx`**

  Add the import alongside the existing `videosApi`/`photosApi` imports.

  This page has two return branches — add `<ContactHelpLink />` to **both**, since someone could get stuck at the password screen too:

  In the unauthenticated branch, just before the outermost closing `</div>` (after `</form>`):
  ```jsx
          </form>
          <ContactHelpLink />
        </div>
      );
    }
  ```

  In the authenticated branch, just before the final closing `</div>` (after the video `.admin-grid` closes):
  ```jsx
          </div>
        </div>
        <ContactHelpLink />
      </div>
    );
  }
  ```
  Look carefully at the actual indentation/nesting in the file before editing — the authenticated branch has photo grid, then video grid, then the page wrapper closes; `<ContactHelpLink />` goes right before that last wrapper close, not between the two grids.

- [ ] **Step 8: Document it in `README.md`**

  In the "Guest Photo Upload Feature" section, add a short note (e.g. near the top, after the feature's opening paragraph):
  ```markdown
  Every guest-facing upload/gallery page (`/upload`, `/upload-video`,
  `/gallery`, `/videos`) and the `/admin` page has a small "Contact Help"
  link that opens a pre-filled email to `javery.chapmanwine@gmail.com` if
  something goes wrong.
  ```

- [ ] **Step 9: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Visit each of `/upload`, `/upload-video`, `/gallery`, `/videos`, and `/admin` (both the login screen and, after entering the password, the authenticated view). Confirm the "Contact Help" link appears in the same place on every page. Click it and confirm your default mail client opens with:
  - To: `javery.chapmanwine@gmail.com`
  - Subject: `Issues uploading photos`
  - A body prompting for a description and the sender's name.

  Then open `/slideshow` and confirm the link does **not** appear there (deliberately excluded — full-bleed, chrome-free display).

- [ ] **Step 10: Commit**

  ```bash
  git add src/components/ContactHelpLink.jsx src/components/ContactHelpLink.css src/pages/UploadPage.jsx src/pages/UploadVideoPage.jsx src/pages/GalleryPage.jsx src/pages/VideosPage.jsx src/pages/AdminPage.jsx README.md
  git commit -m "Add contact help link to upload and gallery pages"
  ```

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-13-video-upload-and-upload-polish-design.md` maps to a task — camp sign + gradient progress bar + shared success screen (Task 1), video storage/no-DB with extension preservation (Task 2), video routes (Tasks 3–5), frontend video API + pages (Tasks 6–9), archive script extension (Task 10), docs (Task 11), contact help link (Task 12).
- **`/slideshow` isolation verified structurally, not just by convention:** no task in this plan modifies `src/pages/SlideshowPage.jsx`, and Task 8/9's verification steps explicitly re-check it after videos exist in the store. Task 12 explicitly re-confirms `/slideshow` has no contact link either, preserving its chrome-free design.
- **Type/interface consistency checked:** the `{id,url,name,uploadedAt}` shape is identical across `server/videoStorage.js`, all four video routes, and all frontend video consumers (`videosApi.js`, `UploadVideoPage`, `VideosPage`, `AdminPage`) — mirroring the same consistency already established for photos in the prior plan.
- **Task 12 depends on Tasks 1, 7, 8, 9** having already built/modified `UploadPage.jsx`, `UploadVideoPage.jsx`, `VideosPage.jsx`, and `AdminPage.jsx` respectively — it must run after all of them, which the task ordering already reflects (it's last).
- **Known limitation carried over from the prior plan:** live end-to-end verification of the Google Photos archive script (real OAuth, real album, real upload) still requires a human with real Google Cloud credentials — Task 10 explicitly calls this out rather than silently skipping it.
