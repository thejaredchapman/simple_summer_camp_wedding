# Batch Photo Upload (up to 30 at once) — Design Spec

Date: 2026-08-15
Status: Approved, ready for implementation planning
Builds on: `2026-08-13-video-upload-and-upload-polish-design.md` (already implemented and merged)

## Purpose

Today `/upload` accepts exactly one photo per submission. Guests with a
camera roll full of wedding photos have to repeat the whole
name-entry-and-submit flow once per photo. This adds the ability to select
up to 30 photos in one go and upload them as a sequential batch, with visible
per-photo status and the ability to retry only the ones that failed.

## Non-goals

- **Videos are out of scope.** `/upload-video` stays single-file — a batch of
  30 videos at up to 250MB each isn't a realistic guest workflow, and the
  video page's existing flow is unaffected by this spec.
- **No backend changes.** `POST /api/photos/upload` already accepts one file
  per request; a batch is just the existing endpoint called once per photo,
  client-side, in a loop. The photo rate limiter is already
  100 uploads/10min/IP, which comfortably covers a 30-photo batch plus
  retries — no limiter change needed.
- **No parallel/concurrent uploads.** Uploads run strictly one at a time
  (see Concurrency below).
- **No silent truncation.** Selecting more than 30 files is rejected
  client-side with a message; the app never silently uploads only the first
  30 and drops the rest.

## Concurrency: sequential, not parallel

Uploads run one at a time, in the order the guest selected the files. This
repo already assumes weak, shared conditions (the video rate limiter's
comment notes venue wifi often NATs many guests behind one IP) — running
30 uploads concurrently from one phone over that connection is more likely to
make all of them stall together than to finish faster. Sequential is slower
in the best case but far more predictable in the realistic case.

## Selection & validation

`UploadPage.jsx`'s file input gains the `multiple` attribute and
`MAX_BATCH_SIZE = 30` (a plain constant, easy to raise later if needed).

On `change`, if more than 30 files are selected, the whole selection is
rejected: `file` state stays empty, and an inline message appears — "You can
upload up to 30 photos at a time. Please select 30 or fewer." — using the
same `.upload-error` styling already used for other validation messages on
this page. The guest must reselect; nothing is auto-trimmed.

## Upload queue

On submit, each selected file becomes a queue item:

```js
{ id, file, status: 'pending' | 'uploading' | 'success' | 'error', errorMessage }
```

The page processes the queue with the same compress-then-upload steps and
the same auto-retry-once-on-5xx logic the single-photo flow already has
(`UploadPage.jsx`'s existing `attemptUpload` retry check:
`!error.status || error.status >= 500`). Each item moves
`pending → uploading → success` or, after the retry is exhausted,
`pending → uploading → error`. The next queued item only starts once the
current one resolves (success or final error) — this is what "sequential"
means operationally, not just "don't fire requests in parallel."

`guestName` is entered once and reused for every photo in the batch — this
matches the existing single-photo endpoint's contract (`guestName` is a
per-request form field, so each of the N requests carries the same name).

## Progress UI

Two pieces, both visible while the queue runs:

**Overall bar** — reuses `UploadProgressBar`, extended with an optional
`label` prop that overrides the default `${percent}%` text:

```jsx
<UploadProgressBar percent={(completedCount / total) * 100} label={`${completedCount}/${total} uploaded`} />
```

`completedCount` increments on both `success` and final `error` (i.e. it
tracks "done being attempted," not just "succeeded") so the bar reaches
100% when the queue finishes regardless of outcome. When `label` is omitted,
`UploadProgressBar` renders `${percent}%` exactly as it does today — the
existing single-photo and video pages are unaffected by this change.

**Per-photo grid** — a new `UploadBatchGrid` component renders one tile per
queue item: a thumbnail (`URL.createObjectURL(file)`, revoked on unmount or
once the item leaves the grid) with a small status badge overlaid —
pending (neutral dot), uploading (spinner), success (checkmark), error
(warning icon). No per-photo numeric percentage — sequential processing
means only one tile is ever mid-upload at a time, and a spinner communicates
that clearly enough without adding a second progress readout to track.

## Completion & retry

When every queue item has resolved:

- **If nothing failed:** show the success screen immediately (see below).
- **If some failed:** keep the grid visible with a
  "Retry N failed photos" button above it. Clicking it re-queues only the
  `error` items (resets them to `pending` and reruns the same sequential
  loop) — successful items are untouched and not re-uploaded. The guest can
  retry as many times as they want, or ignore the failures and use
  "Continue" to proceed to the success screen with whatever succeeded.

## Success screen

`UploadSuccessScreen` gains an optional `count` prop, defaulting to `1`:

```jsx
<UploadSuccessScreen guestName={guestName} mediaType="photo" count={successCount} onUploadAnother={handleUploadAnother} />
```

- `count === 1` (the existing single-photo case, and the untouched video
  page which never passes `count`): "Thanks, {name}! Your photo is up." —
  byte-for-byte the existing copy.
- `count > 1`: "Thanks, {name}! Your {count} photos are up."

"Upload another photo" becomes "Upload more photos" when `count > 1`, reset
via the existing `handleUploadAnother` pattern (clears the queue and file
selection; keeps `guestName` filled in, matching today's behavior for
repeat uploads from the same guest).

## Files

- Modify `src/pages/UploadPage.jsx` — multi-select input, batch queue state
  and processing loop, retry-failed handling
- Modify `src/pages/UploadPage.css` — grid spacing, retry button style
- Create `src/components/UploadBatchGrid.jsx` + `.css` — thumbnail grid with
  per-item status badges
- Modify `src/components/UploadProgressBar.jsx` — optional `label` prop
  (backward-compatible; defaults to current `${percent}%` behavior)
- Modify `src/components/UploadSuccessScreen.jsx` — optional `count` prop
  (backward-compatible; defaults to `1`, existing singular copy)
- `src/lib/photosApi.js` — unchanged; `uploadPhoto` is already
  single-file-per-call, which is exactly what the queue needs

## Testing

No automated test framework in this repo (unchanged constraint from prior
plans) — verification is manual: `npm run dev:all`, then at `/upload` select
1 photo (confirm unchanged single-photo behavior), select 2–5 photos
(confirm sequential upload, grid statuses, success screen pluralization),
select 31 photos (confirm the rejection message, no upload attempted), and
simulate a failure (e.g. temporarily stop the backend mid-batch) to confirm
the retry-failed flow only re-attempts the failed items.
