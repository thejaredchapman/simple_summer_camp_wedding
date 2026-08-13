# Guest Photo Upload & Gallery — Design Spec

Date: 2026-08-12
Status: Approved, ready for implementation planning

## Purpose

Wedding guests scan a QR code, upload photos from their phones, and see everyone's
photos appear in a live gallery and a full-screen slideshow — no app install, no
guest accounts. After the wedding, all photos get archived into a Google Photos
album in one manual step.

## Non-goals

- No live sync to Google Photos during the event (see "Google Photos rationale" below).
- No video uploads — photos only.
- No guest accounts/authentication — anyone with the link can upload and view.
- No full admin auth system — a single shared password is sufficient at this scale.

## Google Photos rationale

Google's Photos Library API still supports app-driven uploads via the
`photoslibrary.appendonly` scope (confirmed post-March-2025 restrictions), but only
into albums the app itself created — not the couple's main library or existing
shared albums. More importantly, unless the app goes through Google's OAuth
verification process, authorization tokens issued to test users expire after 7 days,
requiring re-consent. With the wedding ~4 weeks out, verification isn't realistic,
and a live sync that could silently break mid-event during re-auth is an
unacceptable risk.

**Decision:** guest uploads go to the site's own storage (Vercel Blob) during the
event — reliable, no OAuth risk. After the wedding, a manually-run script does a
single one-time OAuth exchange and pushes every photo into a "Camp Javery Wedding"
Google Photos album for permanent archival.

## Architecture

Everything lives in the existing `simple_summer_camp_wedding` repo — no new project.

### Frontend (`src/`, Vite/React)

Add `react-router-dom` (the site is currently router-less, single-page). New routes:

- `/` — existing homepage, unchanged
- `/upload` — guest upload page
- `/gallery` — grid gallery, auto-refreshing
- `/slideshow` — full-bleed, randomized, auto-advancing display for a venue screen
- `/admin` — password-gated moderation page

### Backend (`server/`, existing Express app — deployed separately on Render/Railway,
alongside the chatbot)

New routes added to the existing `server/index.js`:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/photos/upload` | POST | none (public, rate-limited) | Guest uploads one photo + name |
| `/api/photos` | GET | none (public) | List all photos, newest first |
| `/api/admin/photos` | GET | `x-admin-password` header | Full list for moderation |
| `/api/admin/photos/:id` | DELETE | `x-admin-password` header | Delete a photo |

Reuse the existing in-memory per-IP rate limiter pattern already in
`server/index.js` for `/api/photos/upload` (proposal: 15 uploads / 10 min / IP).

### Storage

Vercel Blob (`@vercel/blob` SDK) via `BLOB_READ_WRITE_TOKEN`. Works from any Node
server, not just Vercel-hosted ones — no change needed to where the Express server
is deployed.

**No database.** Each blob's guest name and upload time are encoded directly in its
pathname, e.g.:

```
guest-photos/2026-09-05T18-22-01_avery_x7k2.jpg
```

`GET /api/photos` and `GET /api/admin/photos` list blobs under the `guest-photos/`
prefix and parse the pathname back into `{ name, uploadedAt, url }`. Deleting a
photo (admin only) deletes the blob directly — it disappears from every view on
next fetch.

### Admin layer

- `/admin` frontend route: a password form (not a full auth system — a shared
  secret is enough at this scale). On success, stores the password in memory for
  the session and sends it as `x-admin-password` on subsequent admin API calls.
- Backend compares the header against `process.env.ADMIN_PASSWORD`; mismatch → 401.
- Admin page shows every photo (including any the public gallery might hide in the
  future) with a delete button, plus a simple count/stat (total uploads).

### Upload flow

1. Guest opens `/upload` (via QR code), enters their name (required text field).
2. Picks/takes a photo via `<input type="file" accept="image/*" capture>`.
3. Client-side compression (`browser-image-compression` or canvas-based resize) to
   ~2000px longest edge, JPEG quality ~0.8 — keeps uploads fast on spotty venue
   wifi and controls storage costs.
4. POST multipart to `/api/photos/upload`. Server validates mime type (image only)
   and size (~15MB cap, rarely hit post-compression), uploads to Vercel Blob, returns
   success.
5. Guest sees a confirmation and the form resets for another photo.
6. One automatic retry on network failure, then a manual "try again" button.

### Gallery & slideshow

- **Grid (`/gallery`)**: fetches `GET /api/photos` on load, polls every ~20s,
  prepends new photos. Responsive grid, tap to view larger.
- **Slideshow (`/slideshow`)**: same feed, shuffled client-side (random order per
  requirement), full-bleed, auto-advances every ~5s, no UI chrome (meant to run
  unattended on a TV/projector). Periodically re-fetches and re-shuffles so new
  uploads join the rotation.

### QR code

One-off script (`scripts/generate-qr.js`, using the `qrcode` npm package) producing
a printable PNG that points at `https://<deployed-domain>/upload`. Not a live
feature — run once, print for signage.

### Post-wedding Google Photos archive

Separate, manually-run script (`scripts/sync-to-google-photos.js`), run once after
the wedding:

1. Opens a one-time OAuth consent flow — Jared/Avery authorize with the
   `photoslibrary.appendonly` scope.
2. Creates (or reuses) a "Camp Javery Wedding" album via the Photos Library API.
3. Downloads every blob under `guest-photos/` and uploads + adds each to that album.

Intentionally decoupled from the live guest-facing flow so the 7-day token-expiry
risk never applies to it — it's one clean exchange done at the couple's
convenience, not something that has to survive the whole event.

### Local development setup (deliverable)

As part of implementation, extend the existing README with a thorough, step-by-step
local setup guide covering:

- Cloning the repo
- Installing frontend (`npm install`) and backend (`cd server && npm install`)
  dependencies
- Creating a Vercel Blob store and obtaining `BLOB_READ_WRITE_TOKEN`
- Setting `ADMIN_PASSWORD` in `server/.env`
- Running frontend + backend together locally (`npm run dev:all`)
- Testing the upload flow from an actual phone against a local server — using the
  machine's LAN IP or a tunnel (e.g. ngrok) so a phone (not just localhost) can
  reach the local backend

## Error handling

- Non-image files or files over the size cap → rejected client- and server-side
  with a friendly inline message, no crash.
- Network failure during upload → one automatic retry, then a manual retry button.
- Wrong/missing admin password → 401, inline error on the admin page, no lockout
  mechanism needed at this scale.
- Blob storage failures → 500 to the client with a friendly message; details
  logged server-side only.

## Testing

Manual testing, following the existing `TESTING_GUIDE.md` conventions:

- Upload from mobile Safari and Chrome, both camera capture and photo library
  selection.
- Confirm gallery grid and slideshow both reflect new uploads within one polling
  cycle.
- Confirm admin delete removes a photo from `/gallery`, `/slideshow`, and
  `/api/photos` immediately.
- Confirm admin routes reject requests with a missing/incorrect password.
- Confirm rate limiting kicks in after the configured threshold and recovers after
  the window.
