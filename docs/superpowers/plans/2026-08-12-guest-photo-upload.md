# Guest Photo Upload & Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let wedding guests scan a QR code, upload photos from their phones (no account needed), and see them in a live grid gallery and a randomized full-screen slideshow — with a password-protected admin page for moderation, and a one-time post-wedding script that archives everything into a Google Photos album.

**Architecture:** Everything lives in the existing `simple_summer_camp_wedding` repo. New Express routes are added to the existing `server/index.js` (already deployed separately from Vercel, e.g. Render/Railway) backed by Vercel Blob storage with no database — each photo's guest name is encoded directly in its blob pathname. The React frontend gains routing (currently single-page) with four new pages. Two standalone Node scripts (not part of the live app) handle QR code generation and the post-wedding Google Photos archive.

**Tech Stack:** Express (existing), `@vercel/blob`, `multer`, React 19 (existing), `react-router-dom`, `browser-image-compression`, `qrcode` (script only), `google-auth-library` (script only).

## Global Constraints

- Guest uploads must never require a Google account or any account — anyone with the `/upload` link can contribute. (Spec: Non-goals)
- Photos only, no video uploads. (Spec: Non-goals)
- No database — photo metadata (guest name) is encoded in the Vercel Blob pathname and parsed back out on read. (Spec: Storage)
- This repo has no automated test framework (confirmed: no jest/vitest in `package.json`, testing is manual per `TESTING_GUIDE.md`). Every task's verification step is a manual command or browser check — do not introduce a new test framework as part of this plan.
- Frontend env vars require the `VITE_` prefix (Vite convention, existing `CLAUDE.md`). Backend env vars go in `server/.env`, documented in the root `.env.example` (existing repo convention, despite the mild inconsistency of documenting server vars in a root file).
- Follow existing component conventions: PascalCase `.jsx` files with a matching PascalCase `.css` file alongside; new pages live in `src/pages/`.
- The Google Photos archive script is a separate, manually-run, one-time-per-run tool. It must never be invoked automatically by the live app — this is what avoids the 7-day OAuth token expiry risk during the wedding itself (Spec: Google Photos rationale).
- Reuse the existing in-memory per-IP rate limiter pattern already in `server/index.js` (rather than adding a new library) by refactoring it into a reusable factory.

---

## Task 1: Photo storage module (Vercel Blob)

**Files:**
- Create: `server/photoStorage.js`
- Modify: `.env.example` (repo root)
- Modify: `server/index.js:34-52` (`validateEnvironment` — add `BLOB_READ_WRITE_TOKEN` to required vars)

**Interfaces:**
- Produces:
  - `buildPhotoPathname(guestName: string): string`
  - `parsePhotoPathname(pathname: string): { name: string }`
  - `uploadPhoto(buffer: Buffer, guestName: string, contentType: string): Promise<{ url: string, pathname: string }>`
  - `listPhotos(): Promise<Array<{ id: string, url: string, name: string, uploadedAt: string }>>`
  - `deletePhoto(pathname: string): Promise<void>`
- Consumes: `@vercel/blob`'s `put`, `list`, `del`; `process.env.BLOB_READ_WRITE_TOKEN` (read implicitly by the SDK).

- [ ] **Step 1: Create a Vercel Blob store and get a token**

  In the Vercel dashboard for the `simple-summer-camp-wedding` project: go to **Storage** → **Create Database** → **Blob**, create a store (e.g. `camp-javery-photos`), then open its **.env.local** tab and copy the `BLOB_READ_WRITE_TOKEN` value.

  Add it to `server/.env` (create the file from `.env.example` if it doesn't exist yet):
  ```
  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
  ```

- [ ] **Step 2: Install the Vercel Blob SDK**

  ```bash
  cd server && npm install @vercel/blob
  ```

- [ ] **Step 3: Write `server/photoStorage.js`**

  ```js
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
  ```

- [ ] **Step 4: Verify pathname encode/decode round-trips**

  Run:
  ```bash
  cd server && node -e "
  import('./photoStorage.js').then(({ buildPhotoPathname, parsePhotoPathname }) => {
    const pathname = buildPhotoPathname(\"Avery O'Brien\");
    console.log('pathname:', pathname);
    const { name } = parsePhotoPathname(pathname);
    console.log('parsed name:', name);
    if (name !== \"Avery O'Brien\") throw new Error('round-trip failed: ' + name);
    console.log('OK');
  });
  "
  ```
  Expected output ends with `OK`.

- [ ] **Step 5: Verify live upload/list/delete against the real Blob store**

  Run:
  ```bash
  cd server && node -e "
  import('dotenv/config').then(async () => {
    const { uploadPhoto, listPhotos, deletePhoto } = await import('./photoStorage.js');
    const blob = await uploadPhoto(Buffer.from('test'), 'Test Guest', 'text/plain');
    console.log('uploaded:', blob.url, blob.pathname);
    const photos = await listPhotos();
    console.log('listPhotos() raw shape:', JSON.stringify(photos, null, 2));
    if (!photos.some(p => p.id === blob.pathname)) throw new Error('uploaded blob missing from list');
    await deletePhoto(blob.pathname);
    const after = await listPhotos();
    if (after.some(p => p.id === blob.pathname)) throw new Error('blob still present after delete');
    console.log('OK');
  });
  "
  ```
  This requires `server/.env` to already have `BLOB_READ_WRITE_TOKEN` set (Step 1). Expected output ends with `OK`. Inspect the logged `listPhotos()` shape — confirm each entry has `id`, `url`, `name`, `uploadedAt` as expected; if `@vercel/blob`'s `list()` response shape differs from what's assumed here (e.g. a different field name for the timestamp), adjust `listPhotos()` in `photoStorage.js` accordingly before continuing.

- [ ] **Step 6: Document the new env var and make it required**

  In `.env.example` (repo root), add after the `VITE_GOOGLE_MAPS_API_KEY` line:
  ```

  # Vercel Blob storage token (for guest photo uploads)
  # Create a Blob store at https://vercel.com/dashboard -> your project -> Storage -> Create Database -> Blob
  BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
  ```

  In `server/index.js`, update `validateEnvironment()`:
  ```js
  function validateEnvironment() {
    const requiredVars = ['ANTHROPIC_API_KEY', 'BLOB_READ_WRITE_TOKEN'];
  ```
  (keep the rest of the function body unchanged — it already loops over `requiredVars`).

- [ ] **Step 7: Commit**

  ```bash
  git add server/photoStorage.js server/package.json server/package-lock.json .env.example server/index.js
  git commit -m "Add Vercel Blob photo storage module for guest uploads"
  ```

---

## Task 2: Guest photo upload endpoint

**Files:**
- Modify: `server/index.js` (rate limiter section `:72-118`, and routes section)

**Interfaces:**
- Consumes: `uploadPhoto` from `./photoStorage.js` (Task 1); existing `sanitizeInput(input: string): string` already in `server/index.js`.
- Produces:
  - `createRateLimiter(windowMs: number, maxRequests: number): (req,res,next) => void` — factory, used again in Task 3.
  - `POST /api/photos/upload` — multipart form fields `guestName` (text) and `photo` (file) → `{ success: true, url: string }` on 200, `{ error: string }` on 4xx/5xx.

- [ ] **Step 1: Install multer**

  ```bash
  cd server && npm install multer
  ```

- [ ] **Step 2: Refactor the rate limiter into a reusable factory**

  In `server/index.js`, replace the existing rate limiting section (the block starting `const rateLimitStore = new Map();` through the end of the `rateLimiter` function, roughly lines 76–118) with:

  ```js
  function createRateLimiter(windowMs, maxRequests) {
    const store = new Map();

    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of store.entries()) {
        if (now - data.windowStart > windowMs) {
          store.delete(key);
        }
      }
    }, 60000);

    return function rateLimiter(req, res, next) {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      let clientData = store.get(clientIP);

      if (!clientData || now - clientData.windowStart > windowMs) {
        clientData = { windowStart: now, requestCount: 1 };
        store.set(clientIP, clientData);
      } else {
        clientData.requestCount++;
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.requestCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + windowMs) / 1000));

      if (clientData.requestCount > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait before making more requests.',
          retryAfter: Math.ceil((clientData.windowStart + windowMs - now) / 1000)
        });
      }

      next();
    };
  }

  const chatRateLimiter = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
  const photoUploadRateLimiter = createRateLimiter(10 * 60 * 1000, 15); // 15 uploads / 10 min / IP
  ```

  Then update the two existing routes that used the old `rateLimiter` middleware to use `chatRateLimiter` instead:
  - `app.post('/api/chat', rateLimiter, validateChatInput, ...)` → `app.post('/api/chat', chatRateLimiter, validateChatInput, ...)`
  - `app.post('/api/documents', rateLimiter, ...)` → `app.post('/api/documents', chatRateLimiter, ...)`

  This preserves the exact prior behavior (same shared counter/window for chat + documents) while making the limiter reusable.

- [ ] **Step 3: Add the upload route**

  Add near the top of the file (after the other imports):
  ```js
  import multer from 'multer';
  import { uploadPhoto } from './photoStorage.js';
  ```

  Add in the ROUTES section, after the `/api/health` route:
  ```js
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  });

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  app.post('/api/photos/upload', photoUploadRateLimiter, (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'That photo is too large (max 15MB). Please try a smaller one.' });
        }
        console.error('Upload parsing error:', err.message);
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
        return res.status(400).json({ error: 'No photo was uploaded.' });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }

      const blob = await uploadPhoto(req.file.buffer, guestName, req.file.mimetype);
      res.json({ success: true, url: blob.url });
    } catch (error) {
      console.error('Photo upload error:', error.message);
      res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  });
  ```

- [ ] **Step 4: Verify the server still boots and existing routes still work**

  ```bash
  cd server && npm run dev
  ```
  In another terminal:
  ```bash
  curl -i http://localhost:3001/api/health
  ```
  Expected: `200` with `{"status":"ok",...}`.

- [ ] **Step 5: Verify the upload endpoint end-to-end**

  With the server still running, from the repo root:
  ```bash
  curl -i -F "guestName=Test Guest" -F "photo=@public/camp-sign.png;type=image/png" http://localhost:3001/api/photos/upload
  ```
  Expected: `200` with `{"success":true,"url":"https://..."}`. Open the returned URL in a browser and confirm the image loads.

  Then verify validation:
  ```bash
  curl -i -F "photo=@public/camp-sign.png;type=image/png" http://localhost:3001/api/photos/upload
  ```
  Expected: `400` with `{"error":"Please enter your name."}` (no `guestName` field sent).

- [ ] **Step 6: Commit**

  ```bash
  git add server/index.js server/package.json server/package-lock.json
  git commit -m "Add guest photo upload endpoint with rate limiting"
  ```

---

## Task 3: Public photo listing endpoint

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `listPhotos` from `./photoStorage.js` (Task 1); `createRateLimiter` (Task 2).
- Produces: `GET /api/photos` → `{ photos: Array<{ id: string, url: string, name: string, uploadedAt: string }> }`.

- [ ] **Step 1: Add the route**

  In `server/index.js`, update the import from `./photoStorage.js`:
  ```js
  import { uploadPhoto, listPhotos } from './photoStorage.js';
  ```

  Add near the other rate limiter instances:
  ```js
  const photoListRateLimiter = createRateLimiter(60 * 1000, 60); // 60 requests / min / IP
  ```

  Add the route, after `/api/photos/upload`:
  ```js
  app.get('/api/photos', photoListRateLimiter, async (req, res) => {
    try {
      const photos = await listPhotos();
      res.json({ photos });
    } catch (error) {
      console.error('List photos error:', error.message);
      res.status(500).json({ error: 'Unable to load photos right now.' });
    }
  });
  ```

- [ ] **Step 2: Verify**

  With the server running (`cd server && npm run dev`):
  ```bash
  curl -s http://localhost:3001/api/photos | node -e "process.stdin.pipe(require('fs').createWriteStream('/dev/stdout'))"
  ```
  Expected: JSON with a `photos` array containing the test photo(s) uploaded in Task 2's verification, each with `id`, `url`, `name`, `uploadedAt`.

- [ ] **Step 3: Commit**

  ```bash
  git add server/index.js
  git commit -m "Add public photo listing endpoint"
  ```

---

## Task 4: Admin moderation endpoints

**Files:**
- Modify: `server/index.js`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `listPhotos`, `deletePhoto` from `./photoStorage.js` (Task 1).
- Produces:
  - `requireAdmin` middleware (checks `x-admin-password` header against `process.env.ADMIN_PASSWORD`).
  - `GET /api/admin/photos` → `{ photos: Array<{id,url,name,uploadedAt}> }` (401 if password missing/wrong).
  - `DELETE /api/admin/photos?id=<encoded pathname>` → `{ success: true }` (401 if password missing/wrong, 400 if `id` missing/invalid).

- [ ] **Step 1: Add `ADMIN_PASSWORD` to env and required vars**

  Choose a password and add it to `server/.env`:
  ```
  ADMIN_PASSWORD=choose-a-strong-password
  ```

  In `.env.example`, add after the `BLOB_READ_WRITE_TOKEN` line added in Task 1:
  ```

  # Password for the /admin photo moderation page (choose your own strong value)
  ADMIN_PASSWORD=choose_a_strong_password
  ```

  In `server/index.js`, update `validateEnvironment()`:
  ```js
  const requiredVars = ['ANTHROPIC_API_KEY', 'BLOB_READ_WRITE_TOKEN', 'ADMIN_PASSWORD'];
  ```

- [ ] **Step 2: Add the admin routes**

  Update the import from `./photoStorage.js`:
  ```js
  import { uploadPhoto, listPhotos, deletePhoto } from './photoStorage.js';
  ```

  Add, after the `/api/photos` route:
  ```js
  function requireAdmin(req, res, next) {
    const providedPassword = req.get('x-admin-password');
    if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect admin password.' });
    }
    next();
  }

  app.get('/api/admin/photos', requireAdmin, async (req, res) => {
    try {
      const photos = await listPhotos();
      res.json({ photos });
    } catch (error) {
      console.error('Admin list photos error:', error.message);
      res.status(500).json({ error: 'Unable to load photos right now.' });
    }
  });

  app.delete('/api/admin/photos', requireAdmin, async (req, res) => {
    try {
      const pathname = req.query.id;
      if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-photos/')) {
        return res.status(400).json({ error: 'Invalid photo id.' });
      }
      await deletePhoto(pathname);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete photo error:', error.message);
      res.status(500).json({ error: 'Unable to delete photo.' });
    }
  });
  ```

  Note: `id` is passed as a query parameter (not a URL segment) because blob pathnames contain `/` (e.g. `guest-photos/x7k2__Avery.jpg`), which Express cannot match inside a single `:id` route segment.

- [ ] **Step 3: Verify auth rejection**

  ```bash
  cd server && npm run dev
  ```
  ```bash
  curl -i http://localhost:3001/api/admin/photos
  ```
  Expected: `401` with `{"error":"Incorrect admin password."}`.

- [ ] **Step 4: Verify authenticated list + delete**

  ```bash
  curl -s -H "x-admin-password: choose-a-strong-password" http://localhost:3001/api/admin/photos
  ```
  Expected: `200` with a `photos` array. Copy one photo's `id` from the output, then:
  ```bash
  curl -i -X DELETE -H "x-admin-password: choose-a-strong-password" \
    "http://localhost:3001/api/admin/photos?id=$(node -e "console.log(encodeURIComponent('PASTE_ID_HERE'))")"
  ```
  Expected: `200` with `{"success":true}`. Re-run the list request and confirm that photo is gone.

- [ ] **Step 5: Commit**

  ```bash
  git add server/index.js .env.example
  git commit -m "Add password-protected admin moderation endpoints"
  ```

---

## Task 5: Frontend routing setup

**Files:**
- Create: `src/pages/HomePage.jsx`
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `<BrowserRouter>` wrapping the app; `App.jsx` rendering `<Routes>`; `src/pages/HomePage.jsx` (the pre-existing homepage, unchanged in content, moved into its own component).
- Consumes: existing `src/components/index.js` barrel exports.

- [ ] **Step 1: Install react-router-dom**

  ```bash
  npm install react-router-dom
  ```

- [ ] **Step 2: Extract the homepage into `src/pages/HomePage.jsx`**

  ```jsx
  import {
    Navbar,
    Hero,
    MeetTheCouple,
    TheirStory,
    PhotoGallery,
    Schedule,
    RSVP,
    Lodging,
    GettingThere,
    FAQs,
    ContactUs,
    Footer,
    Chatbot
  } from '../components';

  export default function HomePage() {
    return (
      <>
        <Navbar />
        <main id="main-content">
          <Hero />
          <TheirStory />
          <MeetTheCouple />
          <PhotoGallery />
          <Schedule />
          <RSVP />
          <Lodging />
          <GettingThere />
          <FAQs />
          <ContactUs />
        </main>
        <Footer />
        <Chatbot />
      </>
    );
  }
  ```

- [ ] **Step 3: Rewrite `src/App.jsx`**

  ```jsx
  import { Routes, Route } from 'react-router-dom';
  import HomePage from './pages/HomePage';
  import './index.css';

  function App() {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    );
  }

  export default App;
  ```

- [ ] **Step 4: Wrap the app in `BrowserRouter` in `src/main.jsx`**

  ```jsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { BrowserRouter } from 'react-router-dom'
  import './index.css'
  import App from './App.jsx'

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
  ```

- [ ] **Step 5: Document `VITE_BACKEND_URL`**

  In `.env.example`, add after the `VITE_GOOGLE_MAPS_API_KEY` line:
  ```

  # Backend URL the frontend calls for chat + photo features (Vite requires the VITE_ prefix)
  VITE_BACKEND_URL=http://localhost:3001
  ```

- [ ] **Step 6: Verify the homepage still renders identically**

  ```bash
  npm run dev
  ```
  Open `http://localhost:5173/` — the page should look and behave exactly as before (all sections present, chatbot bubble visible).

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/HomePage.jsx src/App.jsx src/main.jsx .env.example package.json package-lock.json
  git commit -m "Add client-side routing, extract homepage into its own page"
  ```

---

## Task 6: Upload page

**Files:**
- Create: `src/pages/UploadPage.jsx`
- Create: `src/pages/UploadPage.css`
- Create: `src/lib/photosApi.js`
- Create: `src/lib/compressImage.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `POST /api/photos/upload` (Task 2).
- Produces:
  - `src/lib/photosApi.js#uploadPhoto(guestName: string, file: File|Blob): Promise<{ success: true, url: string }>`
  - `src/lib/compressImage.js#compressPhoto(file: File): Promise<File|Blob>`
  - `/upload` route.

- [ ] **Step 1: Install browser-image-compression**

  ```bash
  npm install browser-image-compression
  ```

- [ ] **Step 2: Write `src/lib/compressImage.js`**

  ```js
  import imageCompression from 'browser-image-compression';

  const COMPRESSION_OPTIONS = {
    maxWidthOrHeight: 2000,
    initialQuality: 0.8,
    fileType: 'image/jpeg',
    useWebWorker: true,
  };

  export async function compressPhoto(file) {
    try {
      return await imageCompression(file, COMPRESSION_OPTIONS);
    } catch (error) {
      console.error('Photo compression failed, uploading original file:', error.message);
      return file;
    }
  }
  ```

- [ ] **Step 3: Write `src/lib/photosApi.js`**

  ```js
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  export async function uploadPhoto(guestName, file) {
    const formData = new FormData();
    formData.append('guestName', guestName);
    formData.append('photo', file);

    const res = await fetch(`${BACKEND_URL}/api/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed. Please try again.');
    }
    return data;
  }
  ```

- [ ] **Step 4: Write `src/pages/UploadPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { compressPhoto } from '../lib/compressImage';
  import { uploadPhoto } from '../lib/photosApi';
  import './UploadPage.css';

  export default function UploadPage() {
    const [guestName, setGuestName] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e) {
      e.preventDefault();
      if (!guestName.trim() || !file) return;
      await attemptUpload(1);
    }

    async function attemptUpload(attempt) {
      setStatus('uploading');
      setErrorMessage('');
      try {
        const compressed = await compressPhoto(file);
        await uploadPhoto(guestName.trim(), compressed);
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
    }

    return (
      <div className="upload-page">
        <div className="upload-card">
          <h1>Share Your Photos!</h1>
          <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

          {status === 'success' ? (
            <div className="upload-success">
              <p>Thanks, {guestName}! Your photo is up.</p>
              <button type="button" onClick={handleUploadAnother}>
                Upload another photo
              </button>
            </div>
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
                capture="environment"
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                disabled={status === 'uploading'}
              />

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

  Note on retry: `attemptUpload` retries once automatically on failure. If the second attempt also fails, the form stays visible (with the same selected file) showing the error — the guest can just press "Upload Photo" again, which acts as the manual retry.

- [ ] **Step 5: Write `src/pages/UploadPage.css`**

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

- [ ] **Step 6: Wire the route in `src/App.jsx`**

  ```jsx
  import { Routes, Route } from 'react-router-dom';
  import HomePage from './pages/HomePage';
  import UploadPage from './pages/UploadPage';
  import './index.css';

  function App() {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </div>
    );
  }

  export default App;
  ```

- [ ] **Step 7: Verify in the browser**

  Run both servers:
  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload` on your phone (same wifi network, use your computer's LAN IP instead of localhost) or in a desktop browser. Enter a name, pick/take a photo, submit. Confirm the success message appears. Then confirm via:
  ```bash
  curl -s -H "x-admin-password: choose-a-strong-password" http://localhost:3001/api/admin/photos
  ```
  that the new photo appears with the correct name.

- [ ] **Step 8: Commit**

  ```bash
  git add src/pages/UploadPage.jsx src/pages/UploadPage.css src/lib/photosApi.js src/lib/compressImage.js src/App.jsx package.json package-lock.json
  git commit -m "Add guest photo upload page"
  ```

---

## Task 7: Grid gallery page

**Files:**
- Create: `src/pages/GalleryPage.jsx`
- Create: `src/pages/GalleryPage.css`
- Modify: `src/lib/photosApi.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/photos` (Task 3).
- Produces: `src/lib/photosApi.js#listPhotos(): Promise<Array<{id,url,name,uploadedAt}>>`; `/gallery` route.

- [ ] **Step 1: Add `listPhotos` to `src/lib/photosApi.js`**

  Append to the existing file:
  ```js
  export async function listPhotos() {
    const res = await fetch(`${BACKEND_URL}/api/photos`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to load photos.');
    }
    return data.photos;
  }
  ```

- [ ] **Step 2: Write `src/pages/GalleryPage.jsx`**

  ```jsx
  import { useEffect, useState } from 'react';
  import { listPhotos } from '../lib/photosApi';
  import './GalleryPage.css';

  const POLL_INTERVAL_MS = 20000;

  export default function GalleryPage() {
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
      let cancelled = false;

      async function fetchPhotos() {
        try {
          const data = await listPhotos();
          if (!cancelled) {
            setPhotos(data);
            setError('');
          }
        } catch (err) {
          if (!cancelled) setError(err.message);
        }
      }

      fetchPhotos();
      const interval = setInterval(fetchPhotos, POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, []);

    return (
      <div className="gallery-page">
        <h1>Camp Javery Photos</h1>
        {error && <p className="gallery-error">{error}</p>}
        <div className="gallery-grid">
          {photos.map(photo => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              className="gallery-item"
            >
              <img src={photo.url} alt={`Photo from ${photo.name}`} loading="lazy" />
              <span className="gallery-item-name">{photo.name}</span>
            </a>
          ))}
        </div>
        {photos.length === 0 && !error && (
          <p className="gallery-empty">No photos yet — be the first to share one!</p>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Write `src/pages/GalleryPage.css`**

  ```css
  .gallery-page {
    min-height: 100vh;
    background: var(--color-cream);
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .gallery-page h1 {
    font-family: var(--font-display);
    color: var(--color-primary);
    text-align: center;
    margin-bottom: var(--spacing-md);
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-xs);
    max-width: 1100px;
    margin: 0 auto;
  }

  .gallery-item {
    position: relative;
    display: block;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform var(--transition-medium);
  }

  .gallery-item:hover img {
    transform: scale(1.05);
  }

  .gallery-item-name {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.35rem 0.5rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    color: white;
    font-size: 0.8rem;
  }

  .gallery-error,
  .gallery-empty {
    text-align: center;
    color: var(--color-text-light);
  }
  ```

- [ ] **Step 4: Wire the route in `src/App.jsx`**

  Add the import and route:
  ```jsx
  import GalleryPage from './pages/GalleryPage';
  ```
  ```jsx
  <Route path="/gallery" element={<GalleryPage />} />
  ```

- [ ] **Step 5: Verify**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/gallery` — confirm photos uploaded in Task 6's verification appear in a grid with guest names. Upload another photo from `/upload` in a second tab and confirm it appears in `/gallery` within ~20 seconds without a manual refresh.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/GalleryPage.jsx src/pages/GalleryPage.css src/lib/photosApi.js src/App.jsx
  git commit -m "Add auto-refreshing grid gallery page"
  ```

---

## Task 8: Slideshow page

**Files:**
- Create: `src/pages/SlideshowPage.jsx`
- Create: `src/pages/SlideshowPage.css`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `listPhotos()` from `src/lib/photosApi.js` (Task 7).
- Produces: `/slideshow` route.

- [ ] **Step 1: Write `src/pages/SlideshowPage.jsx`**

  ```jsx
  import { useEffect, useState, useRef } from 'react';
  import { listPhotos } from '../lib/photosApi';
  import './SlideshowPage.css';

  const POLL_INTERVAL_MS = 20000;
  const SLIDE_INTERVAL_MS = 5000;

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  export default function SlideshowPage() {
    const [photos, setPhotos] = useState([]);
    const [index, setIndex] = useState(0);
    const knownIdsRef = useRef(new Set());

    useEffect(() => {
      let cancelled = false;

      async function fetchPhotos() {
        try {
          const data = await listPhotos();
          if (cancelled) return;
          const currentIds = new Set(data.map(p => p.id));
          const isSameSet =
            currentIds.size === knownIdsRef.current.size &&
            [...currentIds].every(id => knownIdsRef.current.has(id));
          if (!isSameSet) {
            knownIdsRef.current = currentIds;
            setPhotos(shuffle(data));
            setIndex(0);
          }
        } catch (err) {
          console.error('Slideshow fetch error:', err.message);
        }
      }

      fetchPhotos();
      const pollInterval = setInterval(fetchPhotos, POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearInterval(pollInterval);
      };
    }, []);

    useEffect(() => {
      if (photos.length === 0) return;
      const advance = setInterval(() => {
        setIndex(prev => (prev + 1) % photos.length);
      }, SLIDE_INTERVAL_MS);
      return () => clearInterval(advance);
    }, [photos.length]);

    if (photos.length === 0) {
      return (
        <div className="slideshow-page slideshow-empty">
          <p>Waiting for the first photo…</p>
        </div>
      );
    }

    const current = photos[index];

    return (
      <div className="slideshow-page">
        <img
          key={current.id}
          src={current.url}
          alt={`Photo from ${current.name}`}
          className="slideshow-image"
        />
        <p className="slideshow-caption">{current.name}</p>
      </div>
    );
  }
  ```

  This shuffles whenever the *set* of photos changes (new upload or admin deletion), but keeps a stable order between polls otherwise, so the slideshow doesn't jarringly reset every 20 seconds.

- [ ] **Step 2: Write `src/pages/SlideshowPage.css`**

  ```css
  .slideshow-page {
    width: 100vw;
    height: 100vh;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .slideshow-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    animation: slideshow-fade-in 0.6s ease;
  }

  @keyframes slideshow-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .slideshow-caption {
    position: absolute;
    bottom: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-family: var(--font-body);
    font-size: 1.5rem;
    background: rgba(0, 0, 0, 0.5);
    padding: 0.5rem 1.5rem;
    border-radius: 999px;
  }

  .slideshow-empty {
    color: white;
    font-family: var(--font-body);
    font-size: 1.5rem;
  }
  ```

- [ ] **Step 3: Wire the route in `src/App.jsx`**

  ```jsx
  import SlideshowPage from './pages/SlideshowPage';
  ```
  ```jsx
  <Route path="/slideshow" element={<SlideshowPage />} />
  ```

- [ ] **Step 4: Verify**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/slideshow` — confirm it shows a full-screen photo, advances every ~5 seconds, and loops. Upload a new photo from another tab/device and confirm it eventually joins the rotation (within ~20s) and the order re-shuffles.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/SlideshowPage.jsx src/pages/SlideshowPage.css src/App.jsx
  git commit -m "Add randomized full-screen slideshow page"
  ```

---

## Task 9: Admin moderation page

**Files:**
- Create: `src/pages/AdminPage.jsx`
- Create: `src/pages/AdminPage.css`
- Modify: `src/lib/photosApi.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/photos`, `DELETE /api/admin/photos?id=` (Task 4).
- Produces:
  - `src/lib/photosApi.js#adminListPhotos(password: string): Promise<Array<{id,url,name,uploadedAt}>>`
  - `src/lib/photosApi.js#adminDeletePhoto(id: string, password: string): Promise<void>`
  - `/admin` route.

- [ ] **Step 1: Add admin functions to `src/lib/photosApi.js`**

  Append:
  ```js
  export async function adminListPhotos(password) {
    const res = await fetch(`${BACKEND_URL}/api/admin/photos`, {
      headers: { 'x-admin-password': password },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to load photos.');
    }
    return data.photos;
  }

  export async function adminDeletePhoto(id, password) {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/photos?id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to delete photo.');
    }
  }
  ```

- [ ] **Step 2: Write `src/pages/AdminPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { adminListPhotos, adminDeletePhoto } from '../lib/photosApi';
  import './AdminPage.css';

  export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        const data = await adminListPhotos(password);
        setPhotos(data);
        setAuthed(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function handleDelete(id) {
      if (!window.confirm('Delete this photo?')) return;
      try {
        await adminDeletePhoto(id, password);
        setPhotos(prev => prev.filter(p => p.id !== id));
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
              <button type="button" onClick={() => handleDelete(photo.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Write `src/pages/AdminPage.css`**

  ```css
  .admin-page {
    min-height: 100vh;
    background: var(--color-cream);
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .admin-login {
    max-width: 320px;
    margin: 10vh auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .admin-login input {
    padding: 0.75rem;
    border: 1px solid var(--color-cream-dark);
    border-radius: 8px;
    font-size: 1rem;
  }

  .admin-login button,
  .admin-item button {
    padding: 0.75rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .admin-page h1 {
    font-family: var(--font-display);
    color: var(--color-primary);
    text-align: center;
  }

  .admin-stats {
    text-align: center;
    color: var(--color-text-light);
    margin-bottom: var(--spacing-md);
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--spacing-sm);
    max-width: 1100px;
    margin: 0 auto;
  }

  .admin-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .admin-item img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
  }

  .admin-item p {
    padding: 0.4rem;
    font-size: 0.85rem;
    color: var(--color-text);
  }

  .admin-item button {
    width: 100%;
    border-radius: 0;
    background: var(--color-warm-sunset-4);
  }

  .admin-error {
    color: var(--color-warm-sunset-4);
    font-weight: 600;
    text-align: center;
  }
  ```

- [ ] **Step 4: Wire the route in `src/App.jsx`**

  ```jsx
  import AdminPage from './pages/AdminPage';
  ```
  ```jsx
  <Route path="/admin" element={<AdminPage />} />
  ```

- [ ] **Step 5: Verify**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/admin`. Enter the wrong password — confirm an inline error appears. Enter the correct password (from `server/.env`'s `ADMIN_PASSWORD`) — confirm the photo grid and count appear. Click "Delete" on a photo, confirm the browser confirmation dialog, and confirm it disappears from the admin grid, the `/gallery` grid, and the `/slideshow` rotation.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/AdminPage.jsx src/pages/AdminPage.css src/lib/photosApi.js src/App.jsx
  git commit -m "Add password-protected admin moderation page"
  ```

---

## Task 10: QR code generator script

**Files:**
- Create: `scripts/generate-qr.js`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a CLI script `node scripts/generate-qr.js <url>` that writes `scripts/output/upload-qr.png`.
- Consumes: nothing from the app — takes a URL as a CLI argument.

- [ ] **Step 1: Install qrcode**

  ```bash
  npm install --save-dev qrcode
  ```

- [ ] **Step 2: Write `scripts/generate-qr.js`**

  ```js
  #!/usr/bin/env node
  import QRCode from 'qrcode';
  import { mkdir } from 'node:fs/promises';
  import path from 'node:path';

  const targetUrl = process.argv[2];

  if (!targetUrl) {
    console.error('Usage: node scripts/generate-qr.js <upload-page-url>');
    console.error('Example: node scripts/generate-qr.js https://campjavery.com/upload');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'scripts', 'output');
  const outputPath = path.join(outputDir, 'upload-qr.png');

  await mkdir(outputDir, { recursive: true });
  await QRCode.toFile(outputPath, targetUrl, {
    width: 1024,
    margin: 2,
  });

  console.log(`QR code saved to ${outputPath}`);
  console.log(`Encodes: ${targetUrl}`);
  ```

- [ ] **Step 3: Ignore generated output**

  In `.gitignore`, add under the "Build outputs" section:
  ```
  scripts/output
  ```

- [ ] **Step 4: Verify**

  ```bash
  node scripts/generate-qr.js https://example.com/upload
  ```
  Expected: console output confirming the file was saved. Open `scripts/output/upload-qr.png` and confirm it's a scannable QR code (scan it with a phone camera and confirm it opens `https://example.com/upload`).

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/generate-qr.js .gitignore package.json package-lock.json
  git commit -m "Add QR code generator script for the upload link"
  ```

---

## Task 11: Post-wedding Google Photos archive script

**Files:**
- Create: `scripts/sync-to-google-photos.js`
- Modify: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `listPhotos` from `server/photoStorage.js` (Task 1).
- Produces: `node scripts/sync-to-google-photos.js` — a one-time, manually-run CLI script. Generates `server/google-photos-token.json` (gitignored) as an OAuth token cache.

- [ ] **Step 1: Create Google Cloud OAuth credentials**

  1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create a new project (e.g. "Camp Javery Wedding").
  2. Go to **APIs & Services** → **Library**, search for "Google Photos Library API", and enable it.
  3. Go to **APIs & Services** → **OAuth consent screen**. Choose **External**, fill in the required fields (app name, your email). Leave publishing status as **Testing**.
  4. Under **Test users**, add the Google account that owns the Google Photos library you want the wedding album created in (yours or Avery's).
  5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**. Choose **Desktop app** as the application type. Copy the generated **Client ID** and **Client Secret**.

- [ ] **Step 2: Document the env vars**

  In `.env.example`, add:
  ```

  # Google Photos post-wedding archive script (only needed when running scripts/sync-to-google-photos.js)
  # Create OAuth credentials (Desktop app type) at https://console.cloud.google.com/apis/credentials
  GOOGLE_CLIENT_ID=your_google_oauth_client_id
  GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
  ```

  Add the corresponding real values to `server/.env`.

- [ ] **Step 3: Install google-auth-library**

  ```bash
  npm install --save-dev google-auth-library
  ```

- [ ] **Step 4: Write `scripts/sync-to-google-photos.js`**

  ```js
  #!/usr/bin/env node
  import { OAuth2Client } from 'google-auth-library';
  import http from 'node:http';
  import { readFile, writeFile } from 'node:fs/promises';
  import path from 'node:path';
  import dotenv from 'dotenv';

  dotenv.config({ path: new URL('../server/.env', import.meta.url).pathname });

  const { listPhotos } = await import('../server/photoStorage.js');

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
          server.close();

          const redirectUri = `http://localhost:${server.address().port}/oauth2callback`;
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

  main().catch(error => {
    console.error('Sync failed:', error.message);
    process.exit(1);
  });
  ```

- [ ] **Step 5: Ignore the token cache**

  In `.gitignore`, add under "Environment files":
  ```
  server/google-photos-token.json
  ```

- [ ] **Step 6: Verify with a real test photo**

  With at least one photo already uploaded (e.g. from Task 6/7's verification) and `server/.env` containing valid `BLOB_READ_WRITE_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`:
  ```bash
  node scripts/sync-to-google-photos.js
  ```
  Open the printed URL in a browser, sign in as the test user added in Step 1, and approve access. Confirm the script prints `Archived (1/1): ...` and finishes with `Done. 1 archived, 0 failed.`. Open Google Photos for that account and confirm a "Camp Javery Wedding" album exists containing the photo.

  Run the script a second time — confirm it reuses the cached token (no browser prompt) and adds any new photos to the same album (Google Photos' `albums.create` with the same title creates a second album rather than reusing one — if you re-run this after the wedding across multiple sessions, check Google Photos for duplicate "Camp Javery Wedding" albums and merge manually if needed; this is a one-time post-wedding script run once, so this behavior only matters if you sync in multiple runs).

- [ ] **Step 7: Commit**

  ```bash
  git add scripts/sync-to-google-photos.js .env.example .gitignore package.json package-lock.json
  git commit -m "Add post-wedding Google Photos archive script"
  ```

---

## Task 12: Documentation — local setup, testing, and script usage

**Files:**
- Modify: `README.md`
- Modify: `TESTING_GUIDE.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Add a "Guest Photo Upload" section to `README.md`**

  Insert a new section before the `## License` heading at the end of `README.md`:

  ```markdown
  ## Guest Photo Upload Feature

  Guests scan a QR code, upload photos from their phones (no account needed), and see
  them in a live gallery (`/gallery`) and full-screen slideshow (`/slideshow`). You
  moderate uploads from a password-protected `/admin` page.

  ### Local Setup

  1. **Clone and install dependencies:**
     ```bash
     git clone <your-repo-url>
     cd simple_summer_camp_wedding
     npm install
     cd server && npm install && cd ..
     ```

  2. **Create a Vercel Blob store:**
     - In the [Vercel dashboard](https://vercel.com/dashboard), open the
       `simple-summer-camp-wedding` project → **Storage** → **Create Database** → **Blob**.
     - Open the new store's **.env.local** tab and copy the `BLOB_READ_WRITE_TOKEN` value.

  3. **Set up environment variables:**
     - Copy `.env.example` to `server/.env`:
       ```bash
       cp .env.example server/.env
       ```
     - Fill in `server/.env` with:
       - `ANTHROPIC_API_KEY` (existing, required for the chatbot)
       - `BLOB_READ_WRITE_TOKEN` (from step 2)
       - `ADMIN_PASSWORD` (choose any password — this protects `/admin`)
     - In the repo root, create a `.env` file (Vite reads this automatically) with:
       ```
       VITE_BACKEND_URL=http://localhost:3001
       VITE_GOOGLE_MAPS_API_KEY=your_key_if_you_have_one
       ```

  4. **Run everything locally:**
     ```bash
     npm run dev:all
     ```
     This starts the frontend at `http://localhost:5173` and the backend at
     `http://localhost:3001`.

  5. **Test uploading from your actual phone (not just your laptop browser):**
     - Your phone needs to reach your computer's backend and frontend, which
       `localhost` won't do from another device. Two options:
       - **Same wifi network:** find your computer's LAN IP (macOS: `ipconfig getifaddr en0`),
         then visit `http://<your-LAN-IP>:5173/upload` on your phone, and set
         `VITE_BACKEND_URL=http://<your-LAN-IP>:3001` in your root `.env` before
         starting `npm run dev:all` (frontend env vars are baked in at build/start time).
       - **Any network (e.g. testing on cellular):** use a tunnel like
         [ngrok](https://ngrok.com/): `ngrok http 3001` for the backend and
         `ngrok http 5173` for the frontend, then set `VITE_BACKEND_URL` to the
         backend's ngrok URL.

  ### QR Code for Guests

  Once deployed, generate a printable QR code pointing at your live `/upload` page:
  ```bash
  node scripts/generate-qr.js https://your-deployed-domain.com/upload
  ```
  This saves `scripts/output/upload-qr.png` — print it for signage at the venue.

  ### Post-Wedding Google Photos Archive

  After the wedding, archive every guest photo into a Google Photos album in one
  step. This requires a one-time Google Cloud setup — see the detailed walkthrough
  in `scripts/sync-to-google-photos.js`'s Task 11 setup steps, or briefly:

  1. Create OAuth credentials (Desktop app type) in the
     [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
     with the Google Photos Library API enabled.
  2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `server/.env`.
  3. Run:
     ```bash
     node scripts/sync-to-google-photos.js
     ```
  4. Open the printed URL, sign in with the Google account you want the album
     created in, and approve access. The script creates a "Camp Javery Wedding"
     album and uploads every guest photo into it.

  This script is never run automatically — it's meant to be run once, manually,
  whenever you're ready to archive.
  ```

- [ ] **Step 2: Add a testing section to `TESTING_GUIDE.md`**

  Insert before the `## Common Issues & Solutions` heading:

  ```markdown
  ### 10. Guest Photo Upload Testing (10 minutes)

  #### Upload Flow
  - [ ] Open `/upload` on a mobile browser (Safari and Chrome)
  - [ ] Submit with no name — should show a validation error before submitting
  - [ ] Take a new photo via the camera option — should upload and show a success message
  - [ ] Choose an existing photo from the photo library — should upload and show a success message
  - [ ] Turn off wifi mid-upload, confirm an error appears after the automatic retry, then turn wifi back on and resubmit — should succeed

  #### Gallery & Slideshow
  - [ ] Open `/gallery` — confirm all uploaded photos appear with guest names
  - [ ] Upload a new photo from another device/tab — confirm it appears in `/gallery` within ~20 seconds without a manual refresh
  - [ ] Open `/slideshow` on a large screen — confirm it auto-advances every ~5 seconds and loops
  - [ ] Confirm slideshow order is randomized (not the same order as the upload timestamps)

  #### Admin Moderation
  - [ ] Open `/admin`, enter an incorrect password — confirm an inline error, no access granted
  - [ ] Enter the correct password — confirm the full photo list and count appear
  - [ ] Delete a photo — confirm it disappears from `/admin`, `/gallery`, and `/slideshow`
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add README.md TESTING_GUIDE.md
  git commit -m "Document guest photo upload local setup, QR code, and archive script"
  ```

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-12-guest-photo-upload-design.md` maps to a task — architecture/routes (5–9), storage/no-DB (1), admin layer (4, 9), QR code (10), Google Photos archive (11), local setup docs (12), error handling (2, 6), testing (12).
- **Deviation from spec noted inline:** the admin delete route uses a query parameter (`?id=`) instead of a URL path segment, because Express cannot match a `/`-containing value inside a single `:id` segment — functionally identical to what the spec intended, called out in Task 4.
- **Type/interface consistency checked:** `listPhotos()` return shape (`{id,url,name,uploadedAt}`) is identical across `server/photoStorage.js` (Task 1), `GET /api/photos` (Task 3), `GET /api/admin/photos` (Task 4), and both frontend consumers (`GalleryPage`, `SlideshowPage`, `AdminPage`).
