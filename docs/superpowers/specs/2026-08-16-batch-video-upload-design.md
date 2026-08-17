# Batch Video Upload (up to 5 at once) — Design Spec

Date: 2026-08-16
Status: Approved, ready for implementation planning
Builds on: `2026-08-15-batch-photo-upload-design.md` (already implemented and
merged — this spec follows the same overall pattern, adapted for video)

## Purpose

Today `/upload-video` accepts exactly one video per submission. Guests with a
handful of short clips from the wedding have to repeat the whole
name-entry-and-submit flow once per clip. This adds the ability to select up
to 5 videos in one go and upload them as a sequential batch, with visible
per-video status (including live upload progress) and the ability to retry
only the ones that failed.

## Non-goals

- **No backend changes.** `POST /api/videos/upload` already accepts one file
  per request; a batch is just the existing endpoint called once per video,
  client-side, in a loop. The video rate limiter is already
  50 uploads/10min/IP, which comfortably covers a 5-video batch plus retries
  — no limiter change needed.
- **No parallel/concurrent uploads.** Uploads run strictly one at a time (see
  Concurrency below) — more important here than for photos, since the server
  buffers each video fully in memory (`multer.memoryStorage()`, 250MB limit)
  before forwarding to Blob storage. Concurrent large uploads risk exhausting
  server memory.
- **No silent truncation.** Selecting more than 5 files is rejected
  client-side with a message; the app never silently uploads only the first 5
  and drops the rest.
- **No resumable/chunked upload.** A retried video re-uploads from byte zero,
  same as today's single-video retry. Out of scope.
- **No client-side video compression.** Unlike photos (which compress before
  upload), videos upload as-is — matches the current single-video page.

## Why 5, not 30

Photos cap at 30 because they're small and near-instant to upload. Videos are
categorically different: up to 250MB each, uploaded over real (often
venue-wifi-constrained) network time, and fully buffered in server memory
during the request. A cap of 5 keeps the worst realistic case (5 × 250MB =
1.25GB across the batch, one buffered in memory at a time) sane while still
covering the common case of a guest sharing a handful of clips from one
event.

## Concurrency: sequential, not parallel

Same reasoning as the photo batch, reinforced by the server-side memory
buffering above: uploads run one at a time, in the order the guest selected
the files.

## Selection & validation

`UploadVideoPage.jsx`'s file input gains the `multiple` attribute and
`MAX_VIDEO_BATCH_SIZE = 5`.

**Cap check first:** if more than 5 files are selected, the whole selection
is rejected — `items` state stays empty, and an inline message appears ("You
can upload up to 5 videos at a time. Please select 5 or fewer."), same
pattern as the photo batch's cap message. The guest must reselect; nothing is
auto-trimmed.

**Per-file validation, at selection time, before any queue processing:** for
a selection of 5 or fewer, each file is checked immediately against the
existing size (≤250MB) and type (`ALLOWED_VIDEO_TYPES`) rules already used by
the single-video page. A file that fails either check becomes a queue item
with `status: 'error'` and the existing specific message ("That video is too
large (max 250MB)...", "That file type isn't supported...") attached — set
synchronously, without ever touching the network. A file that passes becomes
`status: 'pending'`. This means the batch grid shows a "Failed" tile the
moment invalid files are selected, before the guest even hits submit.

## Upload queue

On submit, only items still `status: 'pending'` enter the queue (pre-flagged
invalid items are skipped — they're already resolved):

```js
{ id, file, status: 'pending' | 'uploading' | 'success' | 'error', errorMessage, progress }
```

The page processes the queue with the same auto-retry-once-on-5xx logic the
single-video flow already has (`!error.status || error.status >= 500`). Each
item moves `pending → uploading → success` or, after the retry is exhausted,
`pending → uploading → error`. The next queued item only starts once the
current one resolves.

`guestName` is entered once and reused for every video in the batch, same as
the existing single-video endpoint's contract.

## Progress UI

Two pieces, both visible whenever `items.length > 0` — including the `idle`
phase, unlike the photo grid, so pre-flagged invalid files are visible
immediately:

**Overall bar** — reuses `UploadProgressBar` with its existing `label` prop
(already added for the photo batch, no further changes needed):

```jsx
<UploadProgressBar percent={(completedCount / total) * 100} label={`${completedCount}/${total} uploaded`} />
```

`completedCount` increments on both `success` and final `error`, same
semantics as the photo batch.

**Per-video grid** — a new `UploadVideoBatchGrid` component renders one tile
per queue item: a `<video>` thumbnail (`muted`, `preload="metadata"`, `src` =
`URL.createObjectURL(file)`, revoked on unmount or once the item leaves the
grid — same lifecycle pattern as `UploadBatchGrid`) with a status badge
overlaid. Unlike the photo grid's badge-only design, the badge shows a live
percentage while `status === 'uploading'` (e.g. "Uploading… 42%"), driven by
`uploadVideo`'s existing `onProgress` callback (`uploadWithProgress.js`
already reports byte-level progress; the single-video page already consumes
it). This exists because video uploads take real, sometimes lengthy time —
a guest watching a frozen "Uploading…" for a large file with no feedback is a
worse experience than the near-instant photo case justified skipping this
for.

## Completion & retry

Same shape as the photo batch:

- **If nothing failed:** show the success screen immediately.
- **If some failed:** keep the grid visible with a "Retry N failed videos"
  button. Clicking it re-queues **all** `error` items — both network
  failures and pre-validation failures — resetting them to `pending` and
  rerunning the queue. A pre-validation failure (e.g. an oversized file) will
  fail again instantly and deterministically on retry, since the underlying
  file hasn't changed. This is accepted as a harmless UX wrinkle rather than
  adding bookkeeping to distinguish "retryable" from "not" — the guest sees
  the same specific error message again immediately, with no wasted network
  call.
- The guest can retry repeatedly or click "Continue" to proceed with
  whatever succeeded, matching the photo batch's zero-success edge case
  (`handleContinue` resets to idle if `successCount === 0` instead of
  showing a nonsensical "0 videos" success screen).

## Success screen

`UploadSuccessScreen` already supports this via its existing `count` prop
(added for the photo batch, no further changes needed):

```jsx
<UploadSuccessScreen guestName={guestName} mediaType="video" count={successCount} onUploadAnother={handleUploadAnother} />
```

`count === 1` renders the existing single-video copy unchanged; `count > 1`
pluralizes ("Your {count} videos are up." / "Upload more videos").

## Files

- Modify `src/pages/UploadVideoPage.jsx` — multi-select input, batch queue
  state and processing loop (including per-item `progress` tracking),
  per-file validation at selection time, retry-failed handling
- Modify `src/pages/UploadPage.css` — shared stylesheet already has the
  batch-grid and retry-action rules from the photo work; add any
  video-grid-specific rules here or in a new file (implementation plan to
  decide based on how much actually differs)
- Create `src/components/UploadVideoBatchGrid.jsx` + `.css` — video thumbnail
  grid with per-item status badges and live upload percentage
- `UploadProgressBar` and `UploadSuccessScreen` — unchanged; both already
  support everything needed via the `label`/`count` props added for the
  photo batch
- `src/lib/videosApi.js` — unchanged; `uploadVideo(guestName, file,
  onProgress)` is already single-file-per-call with progress reporting,
  exactly what the queue needs

## Testing

No automated test framework in this repo (unchanged constraint from prior
plans) — verification is manual: `npm run dev:all`, then at `/upload-video`
select 1 video (confirm unchanged single-video behavior), select 2–3 videos
(confirm sequential upload, live per-tile percentage, grid statuses, success
screen pluralization), select 6 videos (confirm the rejection message, no
upload attempted), select a mix including one oversized or wrong-type file
(confirm it shows "Failed" immediately, before submit, while valid files
still upload normally), and simulate a network failure (e.g. temporarily stop
the backend mid-batch) to confirm the retry-failed flow only re-attempts the
failed items.

**Backend safety note:** this repo's backend (`server/.env`) points at a real
production Vercel Blob store, not a local/dev-only one — there is no
built-in test store. Any live browser verification of this plan performs
real uploads against production. Before running `npm run dev:all` and
testing live, either provision an isolated test Blob store first, or proceed
knowingly against production with an explicit plan to delete test data
afterward via the admin API. Do not assume the backend is safe to hit by
default.
