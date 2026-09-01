# Photo Booth Kiosk App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Capacitor-wrapped Android photo booth app for a Samsung Galaxy Z Flip 7 kiosk: guests pick a 1/2/3/4-photo strip mode, the booth captures shots with a countdown, stamps each photo with the camp sign + #CampJavery in its bottom-right corner, composites an Instagram-ready strip, uploads it to the existing shared gallery (tagged "Photo Booth"), and emails/texts it to the guest.

**Architecture:** A new, independent `photo-booth-app/` Vite+React+Capacitor project (never merged into the main site's routes) talks to the **existing** `server/` Express backend over two new routes. The backend reuses `photoStorage.js`'s Vercel Blob pipeline with a `booth-` pathname prefix, and a new `messaging.js` module sends via Resend (email, already provisioned) and Twilio (SMS/MMS, not yet configured). The main site's `GalleryPage.jsx` gets a filter tab so booth strips are browsable alongside regular guest uploads.

**Tech Stack:** Express (existing), `@vercel/blob` (existing), `multer` (existing), `resend`, `twilio`, React 19 + Vite (new `photo-booth-app/`), `@capacitor/core` + `@capacitor/android` + `@capacitor/cli`, `@capacitor-community/camera-preview`.

## Global Constraints

- The booth app is a separate Vite+React+Capacitor project (`photo-booth-app/`) — never add its screens as routes on the main site; the kiosk must never be able to navigate to the RSVP/registry/chatbot. (Spec: Architecture, Non-goals)
- No native Samsung Flex Mode split-screen — the app runs full-screen. (Spec: Non-goals)
- No new backend service — booth routes live in the existing `server/index.js`, reusing `photoStorage.js`. (Spec: Architecture)
- This repo has no automated test framework (confirmed: no jest/vitest in either `package.json`, no `*.test.js`/`*.spec.js` files anywhere). Every task's verification step is a manual command (`curl`, `node -e`) or browser/device check — do not introduce a new test framework as part of this plan.
- Resend (email) is already provisioned via the Vercel Marketplace — `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN` (`campjavery.com`) are already in the project's env. The sending domain still needs DNS verification in the Resend dashboard before real (non-sandbox) sends work — flagged again in Task 12.
- Twilio (SMS/MMS) is **not yet configured** — no account exists yet. `sendBoothText()` must fail gracefully with a clear per-channel error rather than crash the server when Twilio env vars are absent. (Spec: Setup requirements)
- No Android build tooling is installed locally (confirmed: no `java`, no Android Studio, no `$ANDROID_HOME`, no `gradle`/`adb`). The plan's primary APK-build path is a GitHub Actions workflow; installing Android Studio locally is documented as the alternative for on-device debugging. (Spec: Build & distribution)
- Reuse the existing in-memory rate limiter factory (`createRateLimiter`) already in `server/index.js` — don't add a new library.
- Follow existing conventions: PascalCase `.jsx` components with a matching `.css` file alongside; camelCase helper modules in `lib/`.
- Instagram output sizing is fixed: 1080×1350 for the 1-photo mode, 1080×1920 for the 2/3/4-photo modes. (Spec: Strip compositing)
- The camp sign watermark uses `public/camp-sign-new.png` (already saved at the main site's repo root), copied into `photo-booth-app`'s own `public/` — **not** the older `camp-sign-watermark.png` the main site's regular upload flow uses. (User feedback on spec)
- Each photo's watermark corner mark must survive strip compositing unmodified in its relative position — Task 7's "cover crop" compositing preserves the bottom-right corner of each already-watermarked photo, so watermarking always happens *before* compositing, never after.

---

## Task 1: Photo booth pathname tagging in `photoStorage.js`

**Files:**
- Modify: `server/photoStorage.js:10-14` (`buildPhotoPathname` — add a sibling function after it)
- Modify: `server/photoStorage.js:48-64` (`parsePhotoPathname` — extend to detect the booth prefix)
- Modify: `server/photoStorage.js:140-154` (`listPhotos` — pass `source` through)

**Interfaces:**
- Produces:
  - `buildBoothPhotoPathname(guestName: string): string`
  - `uploadBoothPhoto(buffer: Buffer, guestName: string, contentType: string): Promise<{ url: string, pathname: string }>`
  - `parsePhotoPathname(pathname: string): { name: string, source: 'guest-upload' | 'photo-booth' }` (extended return shape — existing callers that only destructure `{ name }` are unaffected)
  - `listPhotos(): Promise<Array<{ id: string, url: string, name: string, source: 'guest-upload' | 'photo-booth', uploadedAt: string }>>` (extended shape)
- Consumes: existing `PHOTO_PREFIX` constant, existing `put`/`list` imports from `@vercel/blob`.

- [ ] **Step 1: Add the booth prefix marker and `buildBoothPhotoPathname`**

  In `server/photoStorage.js`, right after the existing `buildPhotoPathname` function (after line 14), add:

  ```js
  const BOOTH_PREFIX_MARKER = 'booth-';

  export function buildBoothPhotoPathname(guestName) {
    const randomId = Math.random().toString(36).slice(2, 10);
    const safeName = encodeURIComponent((guestName || '').trim().slice(0, 60) || 'Guest');
    return `${PHOTO_PREFIX}${BOOTH_PREFIX_MARKER}${randomId}__${safeName}.jpg`;
  }
  ```

- [ ] **Step 2: Extend `parsePhotoPathname` to detect the booth prefix**

  Replace the existing `parsePhotoPathname` function (lines 48-64) with:

  ```js
  export function parsePhotoPathname(pathname) {
    const filename = pathname.slice(PHOTO_PREFIX.length);
    const source = filename.startsWith(BOOTH_PREFIX_MARKER) ? 'photo-booth' : 'guest-upload';
    const idAndName = source === 'photo-booth' ? filename.slice(BOOTH_PREFIX_MARKER.length) : filename;
    const separatorIndex = idAndName.indexOf('__');
    const encodedName = separatorIndex === -1
      ? ''
      : idAndName.slice(separatorIndex + 2).replace(/\.jpg$/, '');

    let name = 'Guest';
    if (encodedName) {
      try {
        name = decodeURIComponent(encodedName);
      } catch {
        name = 'Guest';
      }
    }
    return { name, source };
  }
  ```

- [ ] **Step 3: Add `uploadBoothPhoto`**

  Right after the existing `uploadPhoto` function, add:

  ```js
  export async function uploadBoothPhoto(buffer, guestName, contentType) {
    const pathname = buildBoothPhotoPathname(guestName);
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob;
  }
  ```

- [ ] **Step 4: Pass `source` through in `listPhotos`**

  Replace the existing `listPhotos` function (lines 140-154) with:

  ```js
  export async function listPhotos() {
    const { blobs } = await list({ prefix: PHOTO_PREFIX });
    return blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .map(blob => {
        const { name, source } = parsePhotoPathname(blob.pathname);
        return {
          id: blob.pathname,
          url: blob.url,
          name,
          source,
          uploadedAt: blob.uploadedAt,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }
  ```

- [ ] **Step 5: Verify pathname tagging round-trips**

  Run:
  ```bash
  cd server && node -e "
  import('./photoStorage.js').then(({ buildPhotoPathname, buildBoothPhotoPathname, parsePhotoPathname }) => {
    const guestPathname = buildPhotoPathname('Avery');
    const guestParsed = parsePhotoPathname(guestPathname);
    if (guestParsed.source !== 'guest-upload') throw new Error('expected guest-upload, got ' + guestParsed.source);
    if (guestParsed.name !== 'Avery') throw new Error('expected Avery, got ' + guestParsed.name);

    const boothPathname = buildBoothPhotoPathname('Jared');
    console.log('booth pathname:', boothPathname);
    const boothParsed = parsePhotoPathname(boothPathname);
    if (boothParsed.source !== 'photo-booth') throw new Error('expected photo-booth, got ' + boothParsed.source);
    if (boothParsed.name !== 'Jared') throw new Error('expected Jared, got ' + boothParsed.name);

    console.log('OK');
  });
  "
  ```
  Expected output ends with `OK`.

- [ ] **Step 6: Verify live upload/list against the real Blob store**

  Run (requires `server/.env` to already have `BLOB_READ_WRITE_TOKEN` set):
  ```bash
  cd server && node -e "
  import('dotenv/config').then(async () => {
    const { uploadBoothPhoto, listPhotos, deletePhoto } = await import('./photoStorage.js');
    const blob = await uploadBoothPhoto(Buffer.from('test'), 'Test Guest', 'text/plain');
    console.log('uploaded:', blob.pathname);
    const photos = await listPhotos();
    const found = photos.find(p => p.id === blob.pathname);
    if (!found) throw new Error('uploaded booth blob missing from list');
    if (found.source !== 'photo-booth') throw new Error('expected source photo-booth, got ' + found.source);
    await deletePhoto(blob.pathname);
    console.log('OK');
  });
  "
  ```
  Expected output ends with `OK`.

- [ ] **Step 7: Commit**

  ```bash
  git add server/photoStorage.js
  git commit -m "Add photo-booth pathname tagging to photoStorage.js"
  ```

---

## Task 2: Messaging module — Resend email + Twilio SMS

**Files:**
- Create: `server/messaging.js`
- Modify: `server/package.json` (add `resend`, `twilio` dependencies)
- Modify: `.env.example` (repo root — document the new env vars)
- Modify: `server/index.js:47-49` (`validateEnvironment` — add Resend vars as required)

**Interfaces:**
- Produces:
  - `sendBoothEmail({ to: string, guestName: string, photoUrl: string }): Promise<{ success: boolean, error?: string }>`
  - `sendBoothText({ to: string, photoUrl: string }): Promise<{ success: boolean, error?: string }>`
- Consumes: `process.env.RESEND_API_KEY`, `process.env.RESEND_EMAIL_DOMAIN`, `process.env.TWILIO_ACCOUNT_SID`, `process.env.TWILIO_AUTH_TOKEN`, `process.env.TWILIO_FROM_NUMBER`.

- [ ] **Step 1: Install the Resend and Twilio SDKs**

  ```bash
  cd server && npm install resend@^6.25.0 twilio@^6.1.0
  ```

- [ ] **Step 2: Write `server/messaging.js`**

  ```js
  import { Resend } from 'resend';
  import twilio from 'twilio';

  // Lazily constructed on first use, not at module import time — ESM import
  // statements execute before index.js's later `dotenv.config()` call, so
  // reading process.env.* at the top level here would always see undefined.
  let resendClient = null;
  function getResendClient() {
    if (!process.env.RESEND_API_KEY) return null;
    if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
  }

  let twilioClient = null;
  function getTwilioClient() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
    if (!twilioClient) {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return twilioClient;
  }

  export async function sendBoothEmail({ to, guestName, photoUrl }) {
    const resend = getResendClient();
    if (!resend || !process.env.RESEND_EMAIL_DOMAIN) {
      return { success: false, error: 'Email is not configured on this server.' };
    }
    try {
      await resend.emails.send({
        from: `Camp Javery Photo Booth <photobooth@${process.env.RESEND_EMAIL_DOMAIN}>`,
        to,
        subject: 'Your Camp Javery photo booth strip!',
        html: `
          <p>Hi ${guestName || 'there'},</p>
          <p>Here's your photo strip from the Camp Javery photo booth:</p>
          <p><img src="${photoUrl}" alt="Your photo strip" style="max-width:400px; display:block;" /></p>
          <p><a href="${photoUrl}">Open full size</a></p>
          <p>#CampJavery</p>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error('Booth email send error:', error.message);
      return { success: false, error: 'Could not send the email. Please try again.' };
    }
  }

  export async function sendBoothText({ to, photoUrl }) {
    const client = getTwilioClient();
    if (!client || !process.env.TWILIO_FROM_NUMBER) {
      return { success: false, error: 'Text messaging is not configured on this server.' };
    }
    try {
      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to,
        body: 'Your Camp Javery photo booth strip! #CampJavery',
        mediaUrl: [photoUrl],
      });
      return { success: true };
    } catch (error) {
      console.error('Booth text send error:', error.message);
      return { success: false, error: 'Could not send the text. Check the phone number and try again.' };
    }
  }
  ```

- [ ] **Step 3: Document the new env vars**

  In `.env.example` (repo root), add after the `BLOB_READ_WRITE_TOKEN` line:
  ```

  # Resend (transactional email — provisioned via Vercel Marketplace)
  # Already provisioned for this project; pull with `vercel env pull` or copy from the Vercel dashboard.
  RESEND_API_KEY=your_resend_api_key_here
  RESEND_EMAIL_DOMAIN=campjavery.com

  # Twilio (SMS/MMS for the photo booth) — optional until you create a Twilio
  # account and buy a phone number capable of MMS. sendBoothText() fails
  # gracefully with a clear error if these are unset.
  TWILIO_ACCOUNT_SID=your_twilio_account_sid
  TWILIO_AUTH_TOKEN=your_twilio_auth_token
  TWILIO_FROM_NUMBER=+15555550123
  ```

- [ ] **Step 4: Make Resend required in `validateEnvironment`**

  In `server/index.js`, update the `requiredVars` array (line 48):
  ```js
  const requiredVars = ['ANTHROPIC_API_KEY', 'BLOB_READ_WRITE_TOKEN', 'ADMIN_PASSWORD', 'RESEND_API_KEY', 'RESEND_EMAIL_DOMAIN'];
  ```
  (Twilio vars are intentionally **not** added here — they're optional until Twilio is set up.)

- [ ] **Step 5: Verify email sending (requires `server/.env` to have real Resend credentials)**

  Note: this check uses `import('dotenv/config')` before importing `messaging.js`, which loads env vars in a different order than the real server (where `index.js`'s static imports — including `messaging.js` — all resolve *before* its own `dotenv.config()` call runs). This step alone can pass even if the lazy-getter pattern above were accidentally written as eager module-level consts instead; Task 3's Step 6 (hitting the real running server) is what actually proves the ordering works. Run, replacing `you@example.com` with an inbox you can check:
  ```bash
  cd server && node -e "
  import('dotenv/config').then(async () => {
    const { sendBoothEmail } = await import('./messaging.js');
    const result = await sendBoothEmail({
      to: 'you@example.com',
      guestName: 'Test Guest',
      photoUrl: 'https://picsum.photos/seed/campjavery/400/600',
    });
    console.log(JSON.stringify(result));
  });
  "
  ```
  If the domain isn't DNS-verified yet in Resend, `success` will be `false` with an error — that's expected until Task 12's domain verification step; otherwise confirm the email actually arrives.

- [ ] **Step 6: Verify graceful failure when Twilio isn't configured**

  Run (with no `TWILIO_*` vars set):
  ```bash
  cd server && node -e "
  import('./messaging.js').then(async ({ sendBoothText }) => {
    const result = await sendBoothText({ to: '+15555550100', photoUrl: 'https://example.com/x.jpg' });
    if (result.success !== false) throw new Error('expected success:false with no Twilio config');
    console.log('OK:', result.error);
  });
  "
  ```
  Expected output starts with `OK:`.

- [ ] **Step 7: Commit**

  ```bash
  git add server/messaging.js server/package.json server/package-lock.json .env.example server/index.js
  git commit -m "Add Resend/Twilio messaging module for the photo booth"
  ```

---

## Task 3: Backend routes — `/api/photobooth/upload` and `/api/photobooth/send`

**Files:**
- Modify: `server/index.js:6-17` (imports — add `uploadBoothPhoto` and the messaging functions)
- Modify: `server/index.js:136` (rate limiter block — add two new limiters after `videoListRateLimiter`)
- Modify: `server/index.js` (new routes, added after the existing `/api/videos` routes, before `/api/chat`)

**Interfaces:**
- Consumes: `uploadBoothPhoto` (Task 1), `sendBoothEmail`/`sendBoothText` (Task 2), existing `sanitizeInput` (already defined in this file), existing `ALLOWED_IMAGE_TYPES` constant, existing `createRateLimiter`.
- Produces:
  - `POST /api/photobooth/upload` — multipart field `photo` (required), `guestName` (optional) → `200 { success: true, url: string, pathname: string }` or `400/500 { error: string }`
  - `POST /api/photobooth/send` — JSON body `{ photoUrl: string, guestName?: string, email?: string, phone?: string }` → `200 { email: {success,error}|null, sms: {success,error}|null }` or `400/500 { error: string }`

- [ ] **Step 1: Update the import block**

  In `server/index.js`, replace lines 6-17 with:

  ```js
  import { RAGService } from './rag.js';
  import {
    uploadPhoto,
    uploadOriginalPhoto,
    getOriginalPhoto,
    uploadPhotoMetadata,
    getPhotoMetadata,
    uploadPhotoAdminMetadata,
    getPhotoAdminMetadata,
    uploadBoothPhoto,
    listPhotos,
    deletePhoto,
  } from './photoStorage.js';
  import { uploadVideo, listVideos, deleteVideo } from './videoStorage.js';
  import { sendBoothEmail, sendBoothText } from './messaging.js';
  ```

- [ ] **Step 2: Add the two new rate limiters**

  In `server/index.js`, right after the existing `videoListRateLimiter` line (line 136), add:

  ```js
  // Booth is a single kiosk device, but shared venue wifi NATs many guests
  // behind one IP over the course of the night — sized generously.
  const photoboothUploadRateLimiter = createRateLimiter(10 * 60 * 1000, 60); // 60 strips / 10 min / IP
  // Tighter than uploads — sends trigger paid Twilio messages.
  const photoboothSendRateLimiter = createRateLimiter(10 * 60 * 1000, 20); // 20 sends / 10 min / IP
  ```

- [ ] **Step 3: Add the upload route**

  Add this after the existing `/api/videos/upload` route block (after line ~414, right before `app.get('/api/videos', ...)`):

  ```js
  const photoboothUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  });

  app.post('/api/photobooth/upload', photoboothUploadRateLimiter, (req, res, next) => {
    photoboothUpload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'That strip is too large (max 15MB).' });
        }
        console.error('Photo booth upload parsing error:', err.message);
        return res.status(400).json({ error: 'Upload failed. Please try again.' });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const guestName = sanitizeInput(req.body.guestName || '').slice(0, 60) || 'Photo Booth Guest';
      const photoFile = req.file;
      if (!photoFile) {
        return res.status(400).json({ error: 'No photo strip was uploaded.' });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(photoFile.mimetype)) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }

      const blob = await uploadBoothPhoto(photoFile.buffer, guestName, photoFile.mimetype);
      res.json({ success: true, url: blob.url, pathname: blob.pathname });
    } catch (error) {
      console.error('Photo booth upload error:', error.message);
      res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  });

  app.post('/api/photobooth/send', photoboothSendRateLimiter, async (req, res) => {
    try {
      const photoUrl = typeof req.body.photoUrl === 'string' ? req.body.photoUrl : '';
      const guestName = sanitizeInput(req.body.guestName || '').slice(0, 60) || 'Photo Booth Guest';
      const email = sanitizeInput(req.body.email || '').slice(0, 200);
      const phone = sanitizeInput(req.body.phone || '').slice(0, 30);

      if (!photoUrl || !photoUrl.startsWith('https://')) {
        return res.status(400).json({ error: 'Missing or invalid photo URL.' });
      }
      if (!email && !phone) {
        return res.status(400).json({ error: 'Provide an email or phone number.' });
      }

      const [emailResult, smsResult] = await Promise.all([
        email ? sendBoothEmail({ to: email, guestName, photoUrl }) : Promise.resolve(null),
        phone ? sendBoothText({ to: phone, photoUrl }) : Promise.resolve(null),
      ]);

      res.json({ email: emailResult, sms: smsResult });
    } catch (error) {
      console.error('Photo booth send error:', error.message);
      res.status(500).json({ error: 'Send failed. Please try again.' });
    }
  });
  ```

  This needs `express.json()` body parsing for `/api/photobooth/send`'s JSON body — check that the app already calls `app.use(express.json())` somewhere near the top (it does, for `/api/chat`); no change needed if so.

- [ ] **Step 4: Verify the server boots and existing routes still work**

  ```bash
  cd server && npm run dev &
  sleep 2
  curl -i http://localhost:3001/api/health
  ```
  Expected: `200` with the existing health JSON. Kill the background server (`kill %1`) when done.

- [ ] **Step 5: Verify the upload endpoint end-to-end**

  ```bash
  cd server && npm run dev &
  sleep 2
  curl -i -F "guestName=Test Guest" -F "photo=@public/camp-sign.png;type=image/png" http://localhost:3001/api/photobooth/upload
  ```
  Wait — `public/` is at the repo root, not inside `server/`; run this from the repo root instead:
  ```bash
  curl -i -F "guestName=Test Guest" -F "photo=@public/camp-sign.png;type=image/png" http://localhost:3001/api/photobooth/upload
  ```
  Expected: `200` with `{"success":true,"url":"https://...","pathname":"guest-photos/booth-..."}`. Note the `booth-` prefix in `pathname`.

  Then verify validation:
  ```bash
  curl -i http://localhost:3001/api/photobooth/upload
  ```
  Expected: `400` (no file).

- [ ] **Step 6: Verify the send endpoint's validation**

  ```bash
  curl -i -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3001/api/photobooth/send
  ```
  Expected: `400 {"error":"Missing or invalid photo URL."}`.

  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -d '{"photoUrl":"https://example.com/strip.jpg"}' http://localhost:3001/api/photobooth/send
  ```
  Expected: `400 {"error":"Provide an email or phone number."}`.

  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -d '{"photoUrl":"https://example.com/strip.jpg","email":"you@example.com"}' \
    http://localhost:3001/api/photobooth/send
  ```
  Expected: `200` with `{"email":{...},"sms":null}` — `email.success` depends on whether Resend's domain is verified yet (Task 12); `sms` should be `null` since no phone was given. Kill the background server (`kill %1`) when done.

- [ ] **Step 7: Commit**

  ```bash
  git add server/index.js
  git commit -m "Add /api/photobooth/upload and /api/photobooth/send routes"
  ```

---

## Task 4: Gallery filter tab for Photo Booth strips

**Files:**
- Modify: `src/pages/GalleryPage.jsx` (full file, 86 lines)
- Modify: `src/pages/GalleryPage.css`

**Interfaces:**
- Consumes: `photo.source` field (`'guest-upload' | 'photo-booth'`) already present on every object `listPhotos()` returns (Task 1 + Task 3 make this true server-side; `src/lib/photosApi.js`'s `listPhotos()` needs no change — it already passes the full object through).

- [ ] **Step 1: Add filter state and a derived filtered list**

  In `src/pages/GalleryPage.jsx`, add a new state hook right after the existing `lightboxPhotoId` state (after line 15):

  ```jsx
  const [filter, setFilter] = useState('all'); // 'all' | 'photo-booth'
  ```

  And right before the `return` statement (before line 40), add:

  ```jsx
  const filteredPhotos = filter === 'all' ? photos : photos.filter(p => p.source === 'photo-booth');
  ```

- [ ] **Step 2: Add the filter tabs to the JSX and use `filteredPhotos` everywhere `photos` was rendered**

  Replace the whole `return (...)` block (lines 40-85) with:

  ```jsx
  return (
    <div className="gallery-page">
      <h1>Camp Javery Photos</h1>
      <Link to="/upload" className="gallery-upload-button">
        Upload More Photos
      </Link>
      <div className="gallery-filter-tabs">
        <button
          type="button"
          className={filter === 'all' ? 'gallery-filter-tab gallery-filter-tab-active' : 'gallery-filter-tab'}
          onClick={() => setFilter('all')}
        >
          All Photos
        </button>
        <button
          type="button"
          className={filter === 'photo-booth' ? 'gallery-filter-tab gallery-filter-tab-active' : 'gallery-filter-tab'}
          onClick={() => setFilter('photo-booth')}
        >
          Photo Booth
        </button>
      </div>
      {error && <p className="gallery-error">{error}</p>}
      <div className="gallery-grid">
        {filteredPhotos.map(photo => (
          <button
            key={photo.id}
            type="button"
            className="gallery-item"
            onClick={() => setLightboxPhotoId(photo.id)}
          >
            <img
              src={photo.url}
              alt={`Photo from ${photo.name}`}
              loading="lazy"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
            <span className="gallery-item-name">{photo.name}</span>
          </button>
        ))}
      </div>
      {filteredPhotos.length === 0 && !error && (
        <p className="gallery-empty">
          {filter === 'photo-booth' ? 'No photo booth strips yet!' : 'No photos yet — be the first to share one!'}
        </p>
      )}
      <ContactHelpLink />
      {lightboxPhotoId && (() => {
        const lightboxIndex = filteredPhotos.findIndex(p => p.id === lightboxPhotoId);
        if (lightboxIndex === -1) return null;
        return (
          <PhotoLightbox
            key={lightboxPhotoId}
            photos={filteredPhotos}
            index={lightboxIndex}
            onClose={() => setLightboxPhotoId(null)}
            onIndexChange={i => setLightboxPhotoId(filteredPhotos[i]?.id ?? null)}
          />
        );
      })()}
    </div>
  );
  ```

- [ ] **Step 3: Style the filter tabs**

  In `src/pages/GalleryPage.css`, add:

  ```css
  .gallery-filter-tabs {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  .gallery-filter-tab {
    background: var(--color-cream-dark);
    color: var(--color-text);
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .gallery-filter-tab-active {
    background: var(--color-primary);
    color: white;
  }
  ```

- [ ] **Step 4: Verify in the browser**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/gallery`. Confirm both tabs render, "All Photos" shows everything, and "Photo Booth" shows only strips uploaded via `/api/photobooth/upload` (upload one via the `curl` command from Task 3 Step 5 if the gallery is otherwise empty of booth strips, then refresh — the gallery polls every 20s).

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/GalleryPage.jsx src/pages/GalleryPage.css
  git commit -m "Add Photo Booth filter tab to the gallery"
  ```

---

## Task 5: Scaffold `photo-booth-app/` — Vite + React + Capacitor project

**Files:**
- Create: `photo-booth-app/package.json`
- Create: `photo-booth-app/vite.config.js`
- Create: `photo-booth-app/index.html`
- Create: `photo-booth-app/src/main.jsx`
- Create: `photo-booth-app/src/App.jsx`
- Create: `photo-booth-app/src/App.css`
- Create: `photo-booth-app/src/index.css`
- Create: `photo-booth-app/capacitor.config.json`
- Create: `photo-booth-app/.env.example`
- Create: `photo-booth-app/.gitignore`
- Copy: `public/camp-sign-new.png` → `photo-booth-app/public/camp-sign-new.png`

**Interfaces:**
- Produces the `App` component's screen state machine, consumed by Tasks 8-11:
  - Screen state: `'home' | 'capture' | 'review' | 'delivery'`
  - `App` renders `HomeScreen`, `CaptureScreen`, `ReviewScreen`, `DeliveryScreen` (created in later tasks) based on that state, passing the props each screen's task documents.

- [ ] **Step 1: Create the directory and `package.json`**

  ```bash
  mkdir -p photo-booth-app/src/screens photo-booth-app/src/lib photo-booth-app/public
  ```

  Write `photo-booth-app/package.json`:
  ```json
  {
    "name": "camp-javery-photo-booth",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "@capacitor-community/camera-preview": "^8.0.1",
      "@capacitor/android": "^8.5.1",
      "@capacitor/core": "^8.5.1",
      "react": "^19.2.0",
      "react-dom": "^19.2.0"
    },
    "devDependencies": {
      "@capacitor/cli": "^8.5.1",
      "@vitejs/plugin-react": "^5.1.1",
      "vite": "^7.2.4"
    }
  }
  ```

- [ ] **Step 2: Install dependencies**

  ```bash
  cd photo-booth-app && npm install
  ```

- [ ] **Step 3: Write `vite.config.js`**

  ```js
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
  });
  ```

- [ ] **Step 4: Write `index.html`**

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Camp Javery Photo Booth</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 5: Write `src/main.jsx`**

  ```jsx
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import App from './App';
  import './index.css';

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  ```

- [ ] **Step 6: Write `src/index.css` (design tokens copied from the main site)**

  ```css
  :root {
    --color-primary: #2D5A3D;
    --color-secondary: #4A7C59;
    --color-accent: #3D6B4D;
    --color-warm-sunset-1: #F5F0E6;
    --color-warm-sunset-2: #E8E0D0;
    --color-warm-sunset-3: #D4694A;
    --color-warm-sunset-4: #C43D3D;
    --color-cream: #FAF8F3;
    --color-cream-dark: #F0EBE0;
    --color-text: #2D5A3D;
    --gradient-sunset: linear-gradient(90deg, #E3B152 0%, #E0773C 50%, #E44842 100%);

    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'Lora', Georgia, serif;

    --spacing-xs: 0.5rem;
    --spacing-sm: 1rem;
    --spacing-md: 2rem;
    --spacing-lg: 4rem;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    background: var(--color-cream);
    color: var(--color-text);
    font-family: var(--font-body);
  }

  /* @capacitor-community/camera-preview renders the native camera view
     BEHIND the webview (toBack: true) — the webview's own background must
     be transparent while it's active, or the native preview is invisible. */
  body.camera-preview-active,
  body.camera-preview-active #root,
  body.camera-preview-active .screen {
    background: transparent !important;
  }

  .screen {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    text-align: center;
  }
  ```

- [ ] **Step 7: Write `src/App.css`**

  ```css
  .app {
    height: 100vh;
    width: 100vw;
  }
  ```

- [ ] **Step 8: Write `src/App.jsx` (state machine skeleton — screen components arrive in Tasks 8-11)**

  ```jsx
  import { useState, useCallback } from 'react';
  import './App.css';

  const IDLE_TIMEOUT_MS = 60000;

  export default function App() {
    const [screen, setScreen] = useState('home'); // 'home' | 'capture' | 'review' | 'delivery'
    const [mode, setMode] = useState(1); // 1 | 2 | 3 | 4
    const [stripDataUrl, setStripDataUrl] = useState(null);
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);

    const resetToHome = useCallback(() => {
      setScreen('home');
      setStripDataUrl(null);
      setUploadedPhotoUrl(null);
    }, []);

    function handleModeSelected(selectedMode) {
      setMode(selectedMode);
      setScreen('capture');
    }

    function handleStripReady(dataUrl) {
      setStripDataUrl(dataUrl);
      setScreen('review');
    }

    function handleRetake() {
      setStripDataUrl(null);
      setScreen('capture');
    }

    function handleStripUploaded(url) {
      setUploadedPhotoUrl(url);
      setScreen('delivery');
    }

    return (
      <div className="app">
        {screen === 'home' && <div className="screen">Home screen placeholder — Task 8</div>}
        {screen === 'capture' && <div className="screen">Capture screen placeholder — Task 9</div>}
        {screen === 'review' && <div className="screen">Review screen placeholder — Task 10</div>}
        {screen === 'delivery' && <div className="screen">Delivery screen placeholder — Task 11</div>}
      </div>
    );
  }
  ```

  (Tasks 8-11 replace each placeholder `<div>` with the real screen component and wire `handleModeSelected`, `handleStripReady`, `handleRetake`, `handleStripUploaded`, `resetToHome`, `mode`, `stripDataUrl`, `uploadedPhotoUrl`, and `IDLE_TIMEOUT_MS` as props — this step exists so the app boots and is browsable before those screens exist.)

- [ ] **Step 9: Write `capacitor.config.json`**

  ```json
  {
    "appId": "com.campjavery.photobooth",
    "appName": "Camp Javery Photo Booth",
    "webDir": "dist",
    "server": {
      "androidScheme": "https"
    }
  }
  ```

- [ ] **Step 10: Write `.env.example` and `.gitignore`**

  `photo-booth-app/.env.example`:
  ```
  # Backend URL the booth app calls for upload/send (Vite requires the VITE_ prefix)
  VITE_BACKEND_URL=http://localhost:3001
  ```

  `photo-booth-app/.gitignore`:
  ```
  node_modules
  dist
  .env
  .env.local
  android
  ```
  (`android/` is generated by `npx cap add android` in Task 12 and is large/regeneratable — not committed.)

- [ ] **Step 11: Copy the sign asset**

  ```bash
  cp public/camp-sign-new.png photo-booth-app/public/camp-sign-new.png
  ```

- [ ] **Step 12: Verify the app boots**

  ```bash
  cd photo-booth-app && npm run dev
  ```
  Open the printed local URL in a browser. Confirm "Home screen placeholder — Task 8" renders with no console errors. Stop the dev server (Ctrl-C).

- [ ] **Step 13: Commit**

  ```bash
  git add photo-booth-app
  git commit -m "Scaffold photo-booth-app Vite+React+Capacitor project"
  ```

---

## Task 6: Per-photo watermark (`photo-booth-app/src/lib/watermarkPhoto.js`)

**Files:**
- Create: `photo-booth-app/src/lib/watermarkPhoto.js`

**Interfaces:**
- Produces: `watermarkPhoto(photoDataUrl: string): Promise<string>` — returns a new JPEG data URL with `camp-sign-new.png` + "#CampJavery" stamped in the bottom-right corner.
- Consumes: `public/camp-sign-new.png` (Task 5, Step 11), browser `Image`/`Canvas` APIs.

- [ ] **Step 1: Write `watermarkPhoto.js`**

  ```js
  const WATERMARK_SRC = '/camp-sign-new.png';
  const HASHTAG_TEXT = '#CampJavery';
  // Wider than the main site's single-upload watermark (18%) — booth photos
  // are viewed small within a strip tile, so the mark needs to read clearly
  // at that scale.
  const WATERMARK_WIDTH_RATIO = 0.28;
  const MARGIN_RATIO = 0.04;

  let cachedWatermarkImage = null;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  // Composites the camp sign + "#CampJavery" into the bottom-right corner of
  // one photo and returns a new JPEG data URL. Must run BEFORE compositeStrip
  // — the strip's "cover crop" per tile preserves each photo's corner mark in
  // its correct relative position, so watermarking after compositing would
  // put the mark in the wrong place (or clip it) for anything but the last tile.
  export async function watermarkPhoto(photoDataUrl) {
    const [sourceImage, watermarkImage] = await Promise.all([
      loadImage(photoDataUrl),
      cachedWatermarkImage ?? loadImage(WATERMARK_SRC).then(img => (cachedWatermarkImage = img)),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);

    const margin = Math.round(canvas.width * MARGIN_RATIO);
    const markWidth = Math.round(canvas.width * WATERMARK_WIDTH_RATIO);
    const markHeight = Math.round(markWidth * (watermarkImage.height / watermarkImage.width));
    const fontSize = Math.max(14, Math.round(markWidth * 0.11));
    const textGap = Math.round(fontSize * 0.35);

    const markX = canvas.width - markWidth - margin;
    const textY = canvas.height - margin; // hashtag baseline — the bottom-most element
    const markY = textY - fontSize - textGap - markHeight; // sign sits above the hashtag

    ctx.drawImage(watermarkImage, markX, markY, markWidth, markHeight);

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const textX = markX + markWidth;
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.18));
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.strokeText(HASHTAG_TEXT, textX, textY);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(HASHTAG_TEXT, textX, textY);

    return canvas.toDataURL('image/jpeg', 0.92);
  }
  ```

- [ ] **Step 2: Verify with a throwaway test page**

  Temporarily add to `photo-booth-app/src/App.jsx` (inside the `App` function, before `return`, remove after verifying):
  ```jsx
  import { watermarkPhoto } from './lib/watermarkPhoto';
  // ...
  window.__testWatermark = async () => {
    const res = await fetch('/camp-sign-new.png');
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    const watermarked = await watermarkPhoto(dataUrl);
    document.body.innerHTML = `<img src="${watermarked}" style="max-width:100%">`;
  };
  ```
  Run `npm run dev`, open the browser console, call `__testWatermark()`, and visually confirm the sign + "#CampJavery" appear stamped in the bottom-right corner of the rendered image. Remove the temporary code from `App.jsx` afterward.

- [ ] **Step 3: Commit**

  ```bash
  git add photo-booth-app/src/lib/watermarkPhoto.js
  git commit -m "Add per-photo camp sign + hashtag watermark for the photo booth"
  ```

---

## Task 7: Strip compositing (`photo-booth-app/src/lib/compositeStrip.js`)

**Files:**
- Create: `photo-booth-app/src/lib/compositeStrip.js`

**Interfaces:**
- Produces: `compositeStrip(photoDataUrls: string[]): Promise<string>` — takes 1-4 already-watermarked photo data URLs (Task 6's output) and returns one Instagram-ready strip as a JPEG data URL: 1080×1350 for a single photo, 1080×1920 for 2-4 photos.
- Consumes: nothing outside browser `Image`/`Canvas` APIs (photos are already watermarked by the caller).

- [ ] **Step 1: Write `compositeStrip.js`**

  ```js
  const CANVAS_WIDTH = 1080;
  const SINGLE_PHOTO_HEIGHT = 1350; // Instagram 4:5 portrait feed ratio
  const STRIP_HEIGHT = 1920; // Instagram 9:16 Stories/Reels ratio
  const TILE_GAP = 6; // thin border between stacked photos, like a real photobooth strip

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load a captured photo for compositing.'));
      img.src = dataUrl;
    });
  }

  // Draws `image` into the rectangle (x, y, w, h), cropping to fill it without
  // stretching — same behavior as CSS `object-fit: cover`. This preserves each
  // photo's bottom-right watermark position relative to that photo's own tile.
  function drawCover(ctx, image, x, y, w, h) {
    const imageRatio = image.width / image.height;
    const targetRatio = w / h;
    let sx, sy, sw, sh;
    if (imageRatio > targetRatio) {
      sh = image.height;
      sw = sh * targetRatio;
      sx = (image.width - sw) / 2;
      sy = 0;
    } else {
      sw = image.width;
      sh = sw / targetRatio;
      sx = 0;
      sy = (image.height - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  export async function compositeStrip(photoDataUrls) {
    const count = photoDataUrls.length;
    if (count < 1 || count > 4) {
      throw new Error(`compositeStrip expects 1-4 photos, got ${count}`);
    }

    const images = await Promise.all(photoDataUrls.map(loadImage));

    const canvasHeight = count === 1 ? SINGLE_PHOTO_HEIGHT : STRIP_HEIGHT;
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const totalGap = TILE_GAP * (count - 1);
    const tileHeight = (canvasHeight - totalGap) / count;

    images.forEach((image, index) => {
      const y = index * (tileHeight + TILE_GAP);
      drawCover(ctx, image, 0, y, CANVAS_WIDTH, tileHeight);
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  }
  ```

- [ ] **Step 2: Verify canvas dimensions for each mode**

  Temporarily add to `photo-booth-app/src/App.jsx` (remove after verifying):
  ```jsx
  import { watermarkPhoto } from './lib/watermarkPhoto';
  import { compositeStrip } from './lib/compositeStrip';
  // ...
  window.__testStrip = async (count) => {
    const res = await fetch('/camp-sign-new.png');
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    const watermarked = await watermarkPhoto(dataUrl);
    const strip = await compositeStrip(Array(count).fill(watermarked));
    const img = new Image();
    img.onload = () => console.log(`count=${count} -> ${img.width}x${img.height}`);
    img.src = strip;
    document.body.innerHTML = `<img src="${strip}" style="max-width:100%">`;
  };
  ```
  Run `npm run dev`, open the console, and run `__testStrip(1)` — confirm the logged size is `1080x1350`. Then `__testStrip(2)`, `__testStrip(3)`, `__testStrip(4)` — confirm each logs `1080x1920` and the rendered image visually shows the correct number of stacked tiles with a thin gap between them. Remove the temporary code from `App.jsx` afterward.

- [ ] **Step 3: Commit**

  ```bash
  git add photo-booth-app/src/lib/compositeStrip.js
  git commit -m "Add Instagram-ready strip compositing for the photo booth"
  ```

---

## Task 8: Home screen — mode selection

**Files:**
- Create: `photo-booth-app/src/screens/HomeScreen.jsx`
- Create: `photo-booth-app/src/screens/HomeScreen.css`
- Modify: `photo-booth-app/src/App.jsx` (replace the home placeholder)

**Interfaces:**
- Produces: `HomeScreen({ onSelectMode: (count: 1|2|3|4) => void })` — no other props.
- Consumes: nothing beyond the prop above.

- [ ] **Step 1: Write `HomeScreen.jsx`**

  ```jsx
  import './HomeScreen.css';

  export default function HomeScreen({ onSelectMode }) {
    return (
      <div className="screen home-screen">
        <img src="/camp-sign-new.png" alt="Camp Javery" className="home-sign" />
        <h1>Camp Javery Photo Booth</h1>
        <p className="home-subtitle">Pick how many photos for your strip</p>
        <div className="mode-buttons">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              type="button"
              className="mode-button"
              onClick={() => onSelectMode(count)}
            >
              {count} Photo{count > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `HomeScreen.css`**

  ```css
  .home-sign {
    width: 60vw;
    max-width: 320px;
    margin-bottom: var(--spacing-md);
  }

  .home-screen h1 {
    font-family: var(--font-display);
    color: var(--color-primary);
    font-size: 1.8rem;
    margin-bottom: var(--spacing-xs);
  }

  .home-subtitle {
    margin-bottom: var(--spacing-md);
  }

  .mode-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
    width: 100%;
    max-width: 420px;
  }

  .mode-button {
    background: var(--gradient-sunset);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 1.5rem 1rem;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
  }
  ```

- [ ] **Step 3: Wire it into `App.jsx`**

  In `photo-booth-app/src/App.jsx`, add the import at the top:
  ```jsx
  import HomeScreen from './screens/HomeScreen';
  ```
  Replace the home placeholder line:
  ```jsx
  {screen === 'home' && <div className="screen">Home screen placeholder — Task 8</div>}
  ```
  with:
  ```jsx
  {screen === 'home' && <HomeScreen onSelectMode={handleModeSelected} />}
  ```

- [ ] **Step 4: Verify in the browser**

  ```bash
  cd photo-booth-app && npm run dev
  ```
  Confirm the home screen renders the sign, title, and four mode buttons. Clicking a button should currently just show the "Capture screen placeholder" text (Task 9 replaces it) — confirm that transition happens with no console errors.

- [ ] **Step 5: Commit**

  ```bash
  git add photo-booth-app/src/screens/HomeScreen.jsx photo-booth-app/src/screens/HomeScreen.css photo-booth-app/src/App.jsx
  git commit -m "Add photo booth home screen with mode selection"
  ```

---

## Task 9: Capture screen — live camera, countdown, multi-shot sequence

**Files:**
- Modify: `photo-booth-app/package.json` (already has `@capacitor-community/camera-preview` from Task 5 — no change needed)
- Create: `photo-booth-app/src/screens/CaptureScreen.jsx`
- Create: `photo-booth-app/src/screens/CaptureScreen.css`
- Modify: `photo-booth-app/src/App.jsx` (replace the capture placeholder)

**Interfaces:**
- Produces: `CaptureScreen({ mode: 1|2|3|4, onStripReady: (stripDataUrl: string) => void, onCancel: () => void })`.
- Consumes: `watermarkPhoto` (Task 6), `compositeStrip` (Task 7), `@capacitor-community/camera-preview`'s `CameraPreview.start/capture/stop`.

- [ ] **Step 1: Write `CaptureScreen.jsx`**

  ```jsx
  import { useEffect, useRef, useState } from 'react';
  import { CameraPreview } from '@capacitor-community/camera-preview';
  import { watermarkPhoto } from '../lib/watermarkPhoto';
  import { compositeStrip } from '../lib/compositeStrip';
  import './CaptureScreen.css';

  const COUNTDOWN_SECONDS = 3;
  const FREEZE_FRAME_MS = 1200;
  const IDLE_WATCHDOG_MS = 60000;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  export default function CaptureScreen({ mode, onStripReady, onCancel }) {
    const [countdown, setCountdown] = useState(null);
    const [shotIndex, setShotIndex] = useState(0);
    const [freezeFrameUrl, setFreezeFrameUrl] = useState(null);
    const [status, setStatus] = useState('starting'); // starting | countdown | frozen | compositing | error
    const [errorMessage, setErrorMessage] = useState('');
    const capturedShotsRef = useRef([]);
    const cancelledRef = useRef(false);

    useEffect(() => {
      cancelledRef.current = false;
      capturedShotsRef.current = [];
      document.body.classList.add('camera-preview-active');

      async function runCountdown() {
        setStatus('countdown');
        for (let n = COUNTDOWN_SECONDS; n > 0; n--) {
          if (cancelledRef.current) return;
          setCountdown(n);
          await sleep(1000);
        }
        setCountdown(null);
      }

      async function captureAndWatermark() {
        const result = await CameraPreview.capture({ quality: 90 });
        const rawDataUrl = `data:image/jpeg;base64,${result.value}`;
        return watermarkPhoto(rawDataUrl);
      }

      async function runShotSequence() {
        for (let i = 0; i < mode; i++) {
          if (cancelledRef.current) return;
          setShotIndex(i);
          await runCountdown();
          if (cancelledRef.current) return;
          const dataUrl = await captureAndWatermark();
          if (cancelledRef.current) return;
          capturedShotsRef.current.push(dataUrl);
          setFreezeFrameUrl(dataUrl);
          setStatus('frozen');
          await sleep(FREEZE_FRAME_MS);
          if (cancelledRef.current) return;
          setFreezeFrameUrl(null);
        }
        if (cancelledRef.current) return;
        setStatus('compositing');
        const strip = await compositeStrip(capturedShotsRef.current);
        await CameraPreview.stop();
        if (!cancelledRef.current) onStripReady(strip);
      }

      async function startAndRun() {
        try {
          await CameraPreview.start({
            position: 'rear',
            toBack: true,
            disableAudio: true,
            enableZoom: false,
          });
        } catch {
          if (!cancelledRef.current) {
            setStatus('error');
            setErrorMessage('Could not access the camera. Check camera permission in Android settings.');
          }
          return;
        }
        await runShotSequence();
      }

      startAndRun();

      return () => {
        cancelledRef.current = true;
        document.body.classList.remove('camera-preview-active');
        CameraPreview.stop().catch(() => {});
      };
    }, [mode, onStripReady]);

    // Safety-net idle timeout: the sequence above is autonomous (countdown +
    // capture drive themselves), so this only fires if something gets stuck
    // (e.g. the camera hangs) — it resets on every state change the sequence
    // makes, and only returns Home if NOTHING has progressed for 60s.
    useEffect(() => {
      const timer = setTimeout(() => {
        if (!cancelledRef.current) {
          cancelledRef.current = true;
          CameraPreview.stop().catch(() => {});
          onCancel();
        }
      }, IDLE_WATCHDOG_MS);
      return () => clearTimeout(timer);
    }, [status, countdown, shotIndex, freezeFrameUrl, onCancel]);

    function handleCancel() {
      cancelledRef.current = true;
      CameraPreview.stop().catch(() => {});
      onCancel();
    }

    return (
      <div className="screen capture-screen">
        <button type="button" className="capture-cancel-button" onClick={handleCancel}>
          Cancel
        </button>
        <div className="capture-shot-counter">
          Shot {shotIndex + 1} of {mode}
        </div>
        {status === 'countdown' && countdown && (
          <div className="capture-countdown">{countdown}</div>
        )}
        {status === 'frozen' && freezeFrameUrl && (
          <img src={freezeFrameUrl} alt="Just captured" className="capture-freeze-frame" />
        )}
        {status === 'compositing' && <div className="capture-status">Putting your strip together…</div>}
        {status === 'error' && <div className="capture-error">{errorMessage}</div>}
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `CaptureScreen.css`**

  ```css
  .capture-screen {
    position: relative;
    justify-content: flex-start;
    padding-top: var(--spacing-lg);
  }

  .capture-cancel-button {
    position: absolute;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1rem;
  }

  .capture-shot-counter {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 999px;
    padding: 0.4rem 1rem;
    font-weight: 600;
  }

  .capture-countdown {
    font-size: 8rem;
    font-weight: 800;
    color: white;
    text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  }

  .capture-freeze-frame {
    max-width: 90vw;
    max-height: 70vh;
    border-radius: 12px;
    border: 4px solid white;
  }

  .capture-status,
  .capture-error {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: var(--spacing-sm);
    border-radius: 12px;
  }
  ```

- [ ] **Step 3: Wire it into `App.jsx`**

  Add the import:
  ```jsx
  import CaptureScreen from './screens/CaptureScreen';
  ```
  Replace the capture placeholder line:
  ```jsx
  {screen === 'capture' && <div className="screen">Capture screen placeholder — Task 9</div>}
  ```
  with:
  ```jsx
  {screen === 'capture' && (
    <CaptureScreen mode={mode} onStripReady={handleStripReady} onCancel={resetToHome} />
  )}
  ```

- [ ] **Step 4: Verify on a physical Android device (browser dev server has no native camera plugin)**

  `@capacitor-community/camera-preview` requires the native Android shell — it won't work in a plain browser tab. Full verification of this screen happens after Task 12 produces a real `.apk`; for now, confirm the code compiles and the app still boots without runtime errors when the screen is unreached:
  ```bash
  cd photo-booth-app && npm run build
  ```
  Expected: build succeeds with no errors. Revisit this screen's actual camera behavior in Task 12's on-device verification step.

- [ ] **Step 5: Commit**

  ```bash
  git add photo-booth-app/src/screens/CaptureScreen.jsx photo-booth-app/src/screens/CaptureScreen.css photo-booth-app/src/App.jsx
  git commit -m "Add photo booth capture screen with countdown and multi-shot sequence"
  ```

---

## Task 10: Review screen — retake or upload

**Files:**
- Create: `photo-booth-app/src/lib/photoboothApi.js`
- Create: `photo-booth-app/src/screens/ReviewScreen.jsx`
- Create: `photo-booth-app/src/screens/ReviewScreen.css`
- Modify: `photo-booth-app/src/App.jsx` (replace the review placeholder)

**Interfaces:**
- Produces:
  - `uploadBoothStrip(stripDataUrl: string, guestName?: string): Promise<{ success: true, url: string, pathname: string }>` (in `photoboothApi.js`)
  - `sendBoothStrip({ photoUrl, guestName, email, phone }): Promise<{ email: {success,error}|null, sms: {success,error}|null }>` (in `photoboothApi.js`, used by Task 11)
  - `ReviewScreen({ stripDataUrl: string, onRetake: () => void, onUploaded: (url: string) => void, idleTimeoutMs: number, onIdle: () => void })`
- Consumes: `POST /api/photobooth/upload` (Task 3), `VITE_BACKEND_URL` env var (Task 5).

- [ ] **Step 1: Write `photoboothApi.js`**

  ```js
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  async function parseErrorMessage(res) {
    try {
      const data = await res.json();
      return data?.error || 'Something went wrong. Please try again.';
    } catch {
      return 'Something went wrong. Please try again.';
    }
  }

  export async function uploadBoothStrip(stripDataUrl, guestName = '') {
    const formData = new FormData();
    formData.append('photo', dataUrlToBlob(stripDataUrl), 'strip.jpg');
    if (guestName) formData.append('guestName', guestName);

    const res = await fetch(`${BACKEND_URL}/api/photobooth/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return res.json();
  }

  export async function sendBoothStrip({ photoUrl, guestName, email, phone }) {
    const res = await fetch(`${BACKEND_URL}/api/photobooth/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl, guestName, email, phone }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return res.json();
  }
  ```

- [ ] **Step 2: Write `ReviewScreen.jsx`**

  ```jsx
  import { useEffect, useRef, useState } from 'react';
  import { uploadBoothStrip } from '../lib/photoboothApi';
  import './ReviewScreen.css';

  export default function ReviewScreen({ stripDataUrl, onRetake, onUploaded, idleTimeoutMs, onIdle }) {
    const [status, setStatus] = useState('idle'); // idle | uploading | error
    const [errorMessage, setErrorMessage] = useState('');
    const idleTimerRef = useRef(null);

    useEffect(() => {
      idleTimerRef.current = setTimeout(onIdle, idleTimeoutMs);
      return () => clearTimeout(idleTimerRef.current);
    }, [idleTimeoutMs, onIdle]);

    async function handleLooksGood() {
      setStatus('uploading');
      setErrorMessage('');
      try {
        const { url } = await uploadBoothStrip(stripDataUrl);
        onUploaded(url);
      } catch (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Upload failed. Please try again.');
      }
    }

    return (
      <div className="screen review-screen">
        <img src={stripDataUrl} alt="Your photo strip" className="review-strip-preview" />
        {errorMessage && <p className="review-error" role="alert">{errorMessage}</p>}
        <div className="review-actions">
          <button type="button" className="review-retake-button" onClick={onRetake} disabled={status === 'uploading'}>
            Retake
          </button>
          <button type="button" className="review-continue-button" onClick={handleLooksGood} disabled={status === 'uploading'}>
            {status === 'uploading' ? 'Uploading…' : 'Looks Good'}
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Write `ReviewScreen.css`**

  ```css
  .review-strip-preview {
    max-height: 60vh;
    max-width: 90vw;
    border-radius: 12px;
    margin-bottom: var(--spacing-md);
  }

  .review-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .review-actions button {
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .review-retake-button {
    background: var(--color-cream-dark);
    color: var(--color-text);
  }

  .review-continue-button {
    background: var(--gradient-sunset);
    color: white;
  }

  .review-error {
    color: var(--color-warm-sunset-4);
    margin-bottom: var(--spacing-sm);
  }
  ```

- [ ] **Step 4: Wire it into `App.jsx`**

  Add the import:
  ```jsx
  import ReviewScreen from './screens/ReviewScreen';
  ```
  Replace the review placeholder line:
  ```jsx
  {screen === 'review' && <div className="screen">Review screen placeholder — Task 10</div>}
  ```
  with:
  ```jsx
  {screen === 'review' && (
    <ReviewScreen
      stripDataUrl={stripDataUrl}
      onRetake={handleRetake}
      onUploaded={handleStripUploaded}
      idleTimeoutMs={IDLE_TIMEOUT_MS}
      onIdle={resetToHome}
    />
  )}
  ```

- [ ] **Step 5: Verify against the real backend**

  Start the backend (`cd server && node index.js`) and the booth app (`cd photo-booth-app && npm run dev`) in separate terminals, with `photo-booth-app/.env` set to `VITE_BACKEND_URL=http://localhost:3001` (copy from `.env.example`).

  Important: the main site's own Vite dev server also defaults to port 5173. If both are running, the booth app's dev server auto-shifts to 5174 — but the backend's CORS `ALLOWED_ORIGINS` only allows 5173 by default, so requests from 5174 fail client-side as an opaque `TypeError: Failed to fetch` (no CORS error surfaces in the console; check with `curl -i -H "Origin: http://localhost:5174" http://localhost:3001/api/health` — a non-200 confirms it). Stop whatever's on 5173 first so the booth app's dev server binds there.

  Temporarily add this to `App.jsx` (inside the `App` function, after `handleStripUploaded`; remove after verifying) to jump straight to Review with a real image, bypassing Capture (which needs a real device):
  ```jsx
  window.__testJumpToReview = async () => {
    const res = await fetch('/camp-sign-new.png');
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    handleStripReady(dataUrl);
  };
  ```
  In the browser console, run `await window.__testJumpToReview()`, then click "Looks Good" in the UI. Confirm it transitions to the Delivery placeholder (no error message on Review), then confirm the strip actually landed in storage: `curl -s http://localhost:3001/api/photos | grep -o '"id":"[^"]*booth-[^"]*"'` should show a new `booth-` entry. Remove the temporary code from `App.jsx` afterward. Run `npm run build` in `photo-booth-app` to confirm no build errors.

- [ ] **Step 6: Commit**

  ```bash
  git add photo-booth-app/src/lib/photoboothApi.js photo-booth-app/src/screens/ReviewScreen.jsx photo-booth-app/src/screens/ReviewScreen.css photo-booth-app/src/App.jsx
  git commit -m "Add photo booth review screen with retake/upload flow"
  ```

---

## Task 11: Delivery screen — email/text form and confirmation

**Files:**
- Create: `photo-booth-app/src/screens/DeliveryScreen.jsx`
- Create: `photo-booth-app/src/screens/DeliveryScreen.css`
- Modify: `photo-booth-app/src/App.jsx` (replace the delivery placeholder)

**Interfaces:**
- Produces: `DeliveryScreen({ photoUrl: string, idleTimeoutMs: number, onIdle: () => void, onDone: () => void })`.
- Consumes: `sendBoothStrip` (Task 10's `photoboothApi.js`).

- [ ] **Step 1: Write `DeliveryScreen.jsx`**

  ```jsx
  import { useEffect, useRef, useState } from 'react';
  import { sendBoothStrip } from '../lib/photoboothApi';
  import './DeliveryScreen.css';

  export default function DeliveryScreen({ photoUrl, idleTimeoutMs, onIdle, onDone }) {
    const [guestName, setGuestName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | sent
    const [result, setResult] = useState(null);
    const [retryingChannel, setRetryingChannel] = useState(null); // null | 'email' | 'sms'
    const [errorMessage, setErrorMessage] = useState('');
    const idleTimerRef = useRef(null);

    useEffect(() => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(onIdle, idleTimeoutMs);
      return () => clearTimeout(idleTimerRef.current);
    }, [idleTimeoutMs, onIdle, status]);

    async function handleSend(e) {
      e.preventDefault();
      if (!email.trim() && !phone.trim()) {
        setErrorMessage('Enter an email or phone number.');
        return;
      }
      setStatus('sending');
      setErrorMessage('');
      try {
        const sendResult = await sendBoothStrip({
          photoUrl,
          guestName: guestName.trim() || 'Photo Booth Guest',
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        setResult(sendResult);
        setStatus('sent');
      } catch (error) {
        setStatus('idle');
        setErrorMessage(error.message || 'Send failed. Please try again.');
      }
    }

    // Retries only the one failed channel — a channel that already succeeded
    // is never re-sent.
    async function handleRetryChannel(channel) {
      setRetryingChannel(channel);
      try {
        const retryResult = await sendBoothStrip({
          photoUrl,
          guestName: guestName.trim() || 'Photo Booth Guest',
          email: channel === 'email' ? email.trim() : undefined,
          phone: channel === 'sms' ? phone.trim() : undefined,
        });
        setResult(prev => ({ ...prev, [channel]: retryResult[channel] }));
      } catch (error) {
        setResult(prev => ({
          ...prev,
          [channel]: { success: false, error: error.message || 'Retry failed.' },
        }));
      } finally {
        setRetryingChannel(null);
      }
    }

    if (status === 'sent') {
      return (
        <div className="screen delivery-screen">
          <img src={photoUrl} alt="Your photo strip" className="delivery-strip-preview" />
          {result?.email && (
            <p className={result.email.success ? 'delivery-success' : 'delivery-error'}>
              {result.email.success ? 'Emailed! ✓' : `Email failed: ${result.email.error}`}
            </p>
          )}
          {result?.email && !result.email.success && (
            <button
              type="button"
              className="delivery-retry-button"
              onClick={() => handleRetryChannel('email')}
              disabled={retryingChannel === 'email'}
            >
              {retryingChannel === 'email' ? 'Retrying…' : 'Retry Email'}
            </button>
          )}
          {result?.sms && (
            <p className={result.sms.success ? 'delivery-success' : 'delivery-error'}>
              {result.sms.success ? 'Texted! ✓' : `Text failed: ${result.sms.error}`}
            </p>
          )}
          {result?.sms && !result.sms.success && (
            <button
              type="button"
              className="delivery-retry-button"
              onClick={() => handleRetryChannel('sms')}
              disabled={retryingChannel === 'sms'}
            >
              {retryingChannel === 'sms' ? 'Retrying…' : 'Retry Text'}
            </button>
          )}
          <button type="button" className="delivery-done-button" onClick={onDone}>
            Done
          </button>
        </div>
      );
    }

    return (
      <div className="screen delivery-screen">
        <img src={photoUrl} alt="Your photo strip" className="delivery-strip-preview" />
        <form onSubmit={handleSend} className="delivery-form">
          <label htmlFor="booth-name">Your name (optional)</label>
          <input id="booth-name" type="text" value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={60} />

          <label htmlFor="booth-email">Email</label>
          <input id="booth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />

          <label htmlFor="booth-phone">Phone number</label>
          <input id="booth-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />

          {errorMessage && <p className="delivery-error" role="alert">{errorMessage}</p>}

          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send My Photos'}
          </button>
          <button type="button" className="delivery-skip-button" onClick={onDone}>
            Skip, just save to gallery
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `DeliveryScreen.css`**

  ```css
  .delivery-strip-preview {
    max-height: 40vh;
    max-width: 80vw;
    border-radius: 12px;
    margin-bottom: var(--spacing-sm);
  }

  .delivery-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    max-width: 360px;
  }

  .delivery-form label {
    text-align: left;
    font-weight: 600;
    margin-top: var(--spacing-xs);
  }

  .delivery-form input {
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-cream-dark);
    font-size: 1rem;
  }

  .delivery-form button[type="submit"] {
    margin-top: var(--spacing-sm);
    background: var(--gradient-sunset);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .delivery-skip-button {
    background: none;
    border: none;
    color: var(--color-text);
    text-decoration: underline;
    padding: 0.5rem;
    cursor: pointer;
  }

  .delivery-done-button {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .delivery-retry-button {
    background: var(--color-cream-dark);
    color: var(--color-text);
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: var(--spacing-xs);
  }

  .delivery-success {
    color: var(--color-primary);
    font-weight: 600;
  }

  .delivery-error {
    color: var(--color-warm-sunset-4);
    font-weight: 600;
  }
  ```

- [ ] **Step 3: Wire it into `App.jsx`**

  Add the import:
  ```jsx
  import DeliveryScreen from './screens/DeliveryScreen';
  ```
  Replace the delivery placeholder line:
  ```jsx
  {screen === 'delivery' && <div className="screen">Delivery screen placeholder — Task 11</div>}
  ```
  with:
  ```jsx
  {screen === 'delivery' && (
    <DeliveryScreen
      photoUrl={uploadedPhotoUrl}
      idleTimeoutMs={IDLE_TIMEOUT_MS}
      onIdle={resetToHome}
      onDone={resetToHome}
    />
  )}
  ```

- [ ] **Step 4: Verify the full non-camera flow in a browser**

  With the backend running (`cd server && npm run dev`) and the booth app running (`cd photo-booth-app && npm run dev`), temporarily force the app straight to Delivery for testing by editing `App.jsx`'s initial state to `useState('delivery')` for `screen` and setting `uploadedPhotoUrl` to a real URL from Task 3 Step 5's curl upload. Fill in a real email you can check, submit, and confirm the confirmation screen shows "Emailed! ✓" (or the expected sandbox-domain error if Resend's domain isn't verified yet) and that a real email arrives if it succeeds. Revert the temporary initial-state edit afterward.

- [ ] **Step 5: Commit**

  ```bash
  git add photo-booth-app/src/screens/DeliveryScreen.jsx photo-booth-app/src/screens/DeliveryScreen.css photo-booth-app/src/App.jsx
  git commit -m "Add photo booth delivery screen with email/SMS send"
  ```

---

## Task 12: Android packaging — Capacitor native project, CI build, setup docs

**Files:**
- Create: `.github/workflows/build-photo-booth-apk.yml`
- Create: `photo-booth-app/README.md`
- Modify: root `README.md` (if one exists — add a pointer to the booth app; otherwise skip)

**Interfaces:** None (this task produces build tooling and docs, not app code).

- [ ] **Step 1: Add the native Android project**

  ```bash
  cd photo-booth-app
  npm run build
  npx cap add android
  npx cap sync android
  ```
  This generates `photo-booth-app/android/` (gitignored per Task 5 Step 10 — regenerable from `capacitor.config.json` + the web build).

- [ ] **Step 2: Add the camera permission**

  Open `photo-booth-app/android/app/src/main/AndroidManifest.xml` and confirm `<uses-permission android:name="android.permission.CAMERA" />` is present inside the `<manifest>` element (the `@capacitor-community/camera-preview` plugin's own manifest merges this in automatically via Gradle manifest merging — verify it's actually present after `cap sync`, and add it manually if not):
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  ```

- [ ] **Step 3: Write the GitHub Actions build workflow**

  ```yaml
  name: Build Photo Booth APK

  on:
    workflow_dispatch:
    push:
      paths:
        - 'photo-booth-app/**'
      branches: [main]

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Set up JDK 17
          uses: actions/setup-java@v4
          with:
            distribution: temurin
            java-version: '17'

        - name: Set up Android SDK
          uses: android-actions/setup-android@v3

        - name: Set up Node
          uses: actions/setup-node@v4
          with:
            node-version: '20'

        - name: Install dependencies
          working-directory: photo-booth-app
          run: npm install

        - name: Build web assets
          working-directory: photo-booth-app
          run: npm run build

        - name: Add Android platform and sync
          working-directory: photo-booth-app
          run: |
            npx cap add android
            npx cap sync android

        - name: Build debug APK
          working-directory: photo-booth-app/android
          run: ./gradlew assembleDebug

        - name: Upload APK
          uses: actions/upload-artifact@v4
          with:
            name: photo-booth-debug-apk
            path: photo-booth-app/android/app/build/outputs/apk/debug/app-debug.apk
  ```

  Note this workflow runs `npx cap add android` itself (since `android/` is gitignored) rather than relying on a committed native project — keeps the repo free of generated native build files.

- [ ] **Step 4: Write `photo-booth-app/README.md`**

  ```markdown
  # Camp Javery Photo Booth

  A Capacitor-wrapped Android app for the wedding photo booth kiosk (Samsung Galaxy Z Flip 7).

  ## Local development (web preview, no camera)

  ```bash
  npm install
  cp .env.example .env   # set VITE_BACKEND_URL to your local or deployed backend
  npm run dev
  ```

  The live camera preview (`@capacitor-community/camera-preview`) only works inside the native Android shell — the web dev server is useful for iterating on the Home/Review/Delivery screens, but Capture requires a real device.

  ## Building the APK

  **Option A — GitHub Actions (no local Android tooling needed):**
  Push to `main` (or run the workflow manually from the Actions tab) — `build-photo-booth-apk.yml` produces a downloadable `photo-booth-debug-apk` artifact.

  **Option B — Local build (for on-device debugging via USB):**
  1. Install [Android Studio](https://developer.android.com/studio) (bundles the JDK, Android SDK, and Gradle).
  2. `npm run build && npx cap add android && npx cap sync android`
  3. Open `android/` in Android Studio, or run `cd android && ./gradlew assembleDebug` from the terminal.
  4. Connect the Z Flip 7 via USB with USB debugging enabled, then `npx cap run android` for live-reload development.

  ## Installing on the kiosk device

  Transfer the built `.apk` to the Z Flip 7 (e.g. via Google Drive, or `adb install app-debug.apk` over USB), enable "Install unknown apps" for whatever app you used to transfer it, and install. There's no Play Store distribution — this never leaves your own device(s).

  ## Required backend setup (see the main repo's `.env.example`)

  - `RESEND_API_KEY` / `RESEND_EMAIL_DOMAIN` — already provisioned. The `campjavery.com` domain still needs DNS verification in the [Resend dashboard](https://resend.com/domains) before real email sends work — add the SPF/DKIM records it shows you at your domain registrar.
  - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — create a [Twilio](https://www.twilio.com/) account, buy a phone number capable of MMS, and add these to `server/.env`. Until they're set, SMS sends fail gracefully with a clear error and email-only still works.
  ```

- [ ] **Step 5: On-device verification (do this once Twilio/Resend setup from Step 4 is complete)**

  1. Trigger the GitHub Actions workflow (push to `main` or run it manually) and download the `photo-booth-debug-apk` artifact, or build locally per the README.
  2. Install it on the Z Flip 7.
  3. Launch the app, grant camera permission when prompted.
  4. Prop the phone up half-folded on a table (Flex Mode stand position) and run through all four modes (1/2/3/4 photos): confirm the countdown, freeze-frame, and final strip all look right, with the sign + hashtag legible in each photo's bottom-right corner.
  5. Confirm the Review screen's "Looks Good" successfully uploads (check `/gallery` on the main site — the strip should appear under the "Photo Booth" filter tab from Task 4).
  6. Confirm Delivery sends to a real email and (once Twilio is set up) a real phone number, and that a deliberately invalid phone number reports a per-channel failure without blocking a valid email send — then tap "Retry Text" with a corrected number and confirm only that channel re-sends (the already-succeeded email doesn't re-send).
  7. Confirm the idle timeout returns to Home from Review and Delivery after ~60s of no interaction, and confirm Capture's watchdog doesn't fire spuriously during a normal capture sequence (it should only ever trigger if you deliberately stall it, e.g. by denying camera permission and leaving the error screen up).

- [ ] **Step 6: Commit**

  ```bash
  git add .github/workflows/build-photo-booth-apk.yml photo-booth-app/README.md photo-booth-app/.gitignore
  git commit -m "Add GitHub Actions APK build and photo booth setup docs"
  ```
