# Video Upload, Camp Sign Branding & Gradient Progress Bar — Design Spec

Date: 2026-08-13
Status: Approved, ready for implementation planning
Builds on: `2026-08-12-guest-photo-upload-design.md` (already implemented and merged)

## Purpose

Three additions to the guest photo upload feature:

1. Brand the `/upload` (and new `/upload-video`) pages with the Camp Javery sign.
2. Give guests real upload progress feedback with a gradient progress bar styled
   after the sign's own sunset colors.
3. Let guests upload short videos, viewable in a dedicated `/videos` gallery —
   explicitly excluded from `/slideshow`, which stays photos-only.

## Non-goals

- No video transcoding or thumbnail generation — videos play via the browser's
  native `<video>` element, using whatever codec/container the guest's phone
  produced.
- No client-side video compression (not realistically feasible in-browser).
- The `/slideshow` full-screen display is unchanged and never reads video data.

## 1. Camp sign + gradient progress bar

### Sign placement

`/upload` gets the existing `/camp-sign.png` image at the top of the card,
above "Share Your Photos!" — same visual pattern as the chatbot header
(`Chatbot.jsx`'s `.chatbot-header-icon` usage). `/upload-video` (new, see
below) gets the same treatment for visual consistency.

### Gradient colors

Sampled directly from `public/camp-sign.png`'s three sunset bands:

| Band | Hex |
|---|---|
| Gold (top) | `#E3B152` |
| Orange (middle) | `#E0773C` |
| Red (bottom) | `#E44842` |

New CSS variable in `src/index.css`:
```css
--gradient-sunset: linear-gradient(90deg, #E3B152 0%, #E0773C 50%, #E44842 100%);
```

### Progress bar mechanics

`fetch()` does not expose upload progress events. The shared upload helper
switches to `XMLHttpRequest` (`xhr.upload.onprogress`) wrapped in a Promise,
so callers keep an async/await interface with an added optional
`onProgress(percent)` callback.

UI: a horizontal track with `background: var(--gradient-sunset)` clipped to
the current percentage width (the fill container has `width: ${percent}%`,
`overflow: hidden`, with the gradient painted on an inner element at a fixed
100%-track width) — so as the bar fills, progressively more of the
gold→orange→red sweep becomes visible, meaning the visible color genuinely
shifts as the upload advances (mostly gold early, full sweep to red near
100%), not a single flat fill color. A percentage number is overlaid
(`{percent}%`) centered on the bar.

Shared between the photo and video upload pages via a new
`src/components/UploadProgressBar.jsx` (+ `.css`) component, to avoid
duplicating the gradient/animation logic.

### Shared success screen

`/upload` and `/upload-video` remain two separate pages/routes (each with
its own name field, file picker, and progress bar), but both render the
same `src/components/UploadSuccessScreen.jsx` (+ `.css`) component for the
post-upload confirmation state, parameterized by a `mediaType` prop
(`"photo" | "video"`) so the copy is correct for what was actually
uploaded — e.g. "Thanks, {name}! Your photo is up." vs "Thanks, {name}!
Your video is up." The "Upload another" reset button and styling are
identical between the two; only the message text differs.

## 2. Video upload

### Upload page

New route `/upload-video`, new page `src/pages/UploadVideoPage.jsx` (+
`.css`) — structurally a twin of `UploadPage.jsx` (name field, file picker,
progress bar, one auto-retry then resubmit-to-retry, success/error states),
but:

- `<input type="file" accept="video/*">` — no `capture` attribute (guests
  should be able to pick existing videos from their library, same reasoning
  as the photo page's earlier fix).
- No client-side compression step.
- Client-side size check: reject files over 250MB before attempting upload,
  with a friendly inline message. Server re-validates the same limit.
- Accepted MIME types (client accept hint + server allowlist):
  `video/mp4`, `video/quicktime` (iOS `.mov`), `video/webm`, `video/3gpp`.

### Storage

New `server/videoStorage.js`, structurally parallel to `server/photoStorage.js`
but for the `guest-videos/` Blob prefix. Key difference: videos are **not**
normalized to a single format the way photos are forced to `.jpg` — the
pathname preserves the original file's extension, derived from its MIME type
(`video/mp4` → `.mp4`, `video/quicktime` → `.mov`, `video/webm` → `.webm`,
`video/3gpp` → `.3gp`), so the browser's native `<video>` player gets a
correctly-typed file.

Pathname scheme (same no-database, metadata-in-pathname approach as photos):
```
guest-videos/{randomId}__{encodeURIComponent(guestName)}.{ext}
```

Exports: `buildVideoPathname(guestName, ext)`, `parseVideoPathname(pathname)`,
`uploadVideo(buffer, guestName, contentType)`, `listVideos()`,
`deleteVideo(pathname)` — same shapes as the photo module's equivalents.

### Backend routes (`server/index.js`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/videos/upload` | POST | none (public, rate-limited) | Guest uploads one video + name |
| `/api/videos` | GET | none (public, rate-limited) | List all videos, newest first |
| `/api/admin/videos` | GET | `x-admin-password` header | Full list for moderation |
| `/api/admin/videos` | DELETE | `x-admin-password` header | Delete a video (`?id=`, same query-param reasoning as photos) |

Video upload rate limit: 5 uploads / 10 min / IP (tighter than photos, given
file size) — reuses the existing `createRateLimiter` factory.

### Videos gallery page

New route `/videos`, new page `src/pages/VideosPage.jsx` (+ `.css`) —
structurally parallel to `GalleryPage.jsx` (fetch on mount, poll every ~20s),
rendering a grid of `<video controls>` elements (browser-native poster
frame, no server-side thumbnail generation) with guest name captions.

### Admin page

`src/pages/AdminPage.jsx` gains a second "Videos" section below the existing
photo grid, behind the same password gate — same list/delete pattern, calling
the new admin video endpoints. `src/lib/videosApi.js` (new file, parallel to
`photosApi.js`) holds `uploadVideo`, `listVideos`, `adminListVideos`,
`adminDeleteVideo`.

### Slideshow — explicitly unchanged

`src/pages/SlideshowPage.jsx` continues to import only `listPhotos` from
`src/lib/photosApi.js`. It has no dependency on `videosApi.js` or
`videoStorage.js` at all — videos are structurally excluded, not filtered
out of an otherwise-shared feed.

### Post-wedding archive script

`scripts/sync-to-google-photos.js` is extended to also fetch
`listVideos()` (from `server/videoStorage.js`) and upload each into the
**same** "Camp Javery Wedding" album, using the same `uploadBytes`/
`addToAlbum` REST calls already built for photos (the Google Photos Library
API accepts video bytes through the same upload endpoint). Per-item error
isolation (one failed video doesn't abort the run) matches the existing
photo-loop behavior.

## Error handling

- Video file over 250MB or wrong MIME type → rejected client- and
  server-side with a friendly inline message, consistent with the photo
  upload's existing validation pattern.
- Upload progress UI degrades gracefully if `XMLHttpRequest` progress events
  are unavailable for some reason (falls back to an indeterminate state
  rather than a broken percentage).
- Same one-automatic-retry-then-resubmit pattern as photo upload.

## Testing

Manual, per existing repo convention (no automated test framework):

- Upload a video from an iPhone (native `.mov`) and an Android phone
  (native `.mp4`) via `/upload-video`; confirm both appear in `/videos` and
  play back via the browser's native controls.
- Confirm a >250MB file is rejected client-side with a clear message before
  any upload attempt starts.
- Confirm the progress bar reaches 100% and matches actual upload
  completion (compare against network tab timing) for both a photo and a
  video upload.
- Confirm `/slideshow` never displays a video and has no console errors
  after videos exist in the store.
- Confirm admin video list/delete works and is reflected in `/videos`.
- Confirm the archive script picks up both a test photo and a test video in
  one run (requires real Google OAuth credentials, same manual/human-only
  verification constraint as the original photo archive script).
