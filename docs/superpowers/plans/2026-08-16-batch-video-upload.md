# Batch Video Upload (up to 5 at once) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a guest select up to 5 videos at once on `/upload-video` and have them upload sequentially with visible per-video status (including live upload percentage), instead of one video per submission.

**Architecture:** No backend changes — `POST /api/videos/upload` already handles one file per request, so a batch is just `UploadVideoPage.jsx` calling the existing `uploadVideo()` client once per selected file, in a sequential loop with a small queue state machine. `UploadProgressBar` and `UploadSuccessScreen` are reused completely unchanged (their `label`/`count` props already exist from the batch photo upload work). One new component, `UploadVideoBatchGrid`, shows per-video thumbnails, status, and live upload percentage.

**Tech Stack:** Same as the rest of the repo — React 19, plain component state (`useState`), no new dependencies.

## Global Constraints

- No backend changes. `POST /api/videos/upload` is unchanged; the video rate limiter stays at 50 uploads/10min/IP (already enough for a 5-video batch plus retries).
- Photos are out of scope — `/upload` (`src/pages/UploadPage.jsx`) is not touched by this plan.
- Uploads run strictly sequentially, one at a time — never concurrent. This matters more than for photos: the server buffers each video fully in memory (`multer.memoryStorage()`, 250MB limit) before forwarding to Blob storage, so concurrent large uploads risk exhausting server memory.
- `MAX_VIDEO_BATCH_SIZE = 5`. Selecting more is rejected client-side with a message; the app never silently truncates to the first 5.
- Each selected file is validated (size ≤250MB, allowed MIME type) synchronously at selection time, before any network call — an invalid file becomes an `error`-status item immediately, valid files become `pending`. This must happen even for files the guest never submits.
- No automated test framework in this repo — every verification step is a manual browser check via `npm run dev:all`.
- **Backend safety note:** `server/.env` in this repo points at a real production Vercel Blob store — there is no built-in local/dev-only store. Two real incidents already happened during the batch photo upload work where live browser verification accidentally wrote real test data to production. Before running any live verification step below: either provision an isolated test Blob store first, or proceed knowingly against production with an explicit plan to delete test data afterward via the admin API (`DELETE /api/admin/videos?id=...` with `x-admin-password`). Do not assume the backend is safe to hit by default.
- Follow existing conventions: PascalCase `.jsx` + matching `.css`, pages in `src/pages/`, shared cross-page UI in `src/components/`.
- `UploadProgressBar` and `UploadSuccessScreen` require zero changes — both already support everything this plan needs via the `label`/`count` props added for the photo batch. Do not modify them.

---

## Task 1: Per-video status grid component

**Files:**
- Create: `src/components/UploadVideoBatchGrid.jsx`
- Create: `src/components/UploadVideoBatchGrid.css`

**Interfaces:**
- Produces: `UploadVideoBatchGrid({ items: Array<{ id: string, file: File, status: "pending"|"uploading"|"success"|"error", errorMessage: string, progress: number }> })` — renders one thumbnail tile per item with a status badge. While `status === 'uploading'`, the badge shows a live percentage (e.g. "Uploading… 42%") driven by `item.progress`. No callbacks; purely presentational.
- Consumes: nothing — takes plain `File` objects and builds its own object URLs for `<video>` thumbnails, revoking them appropriately.

- [ ] **Step 1: Write `src/components/UploadVideoBatchGrid.jsx`**

  ```jsx
  import { useEffect, useRef, useState } from 'react';
  import './UploadVideoBatchGrid.css';

  const STATUS_LABEL = {
    pending: 'Pending',
    uploading: 'Uploading…',
    success: 'Uploaded',
    error: 'Failed',
  };

  function statusLabel(item) {
    if (item.status === 'uploading') {
      return `Uploading… ${item.progress ?? 0}%`;
    }
    return STATUS_LABEL[item.status];
  }

  export default function UploadVideoBatchGrid({ items }) {
    const [thumbnails, setThumbnails] = useState({});
    // Mirrors `thumbnails` so the unmount-cleanup effect below can revoke
    // every outstanding URL by reading the ref directly, instead of going
    // through a setState updater that may never run on an unmounting fiber.
    const thumbnailsRef = useRef({});

    // Only create a thumbnail URL the first time an item's id appears, and
    // revoke URLs for ids that are no longer present. This deliberately does
    // NOT recreate URLs on every status/progress change (pending ->
    // uploading -> success), since `items` gets a new array reference on
    // every queue update but the underlying File objects don't change.
    useEffect(() => {
      const next = { ...thumbnailsRef.current };
      const currentIds = new Set(items.map(item => item.id));

      items.forEach(item => {
        if (!next[item.id]) {
          next[item.id] = URL.createObjectURL(item.file);
        }
      });

      Object.keys(next).forEach(id => {
        if (!currentIds.has(id)) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
        }
      });

      thumbnailsRef.current = next;
      setThumbnails(next);
    }, [items]);

    // Revoke every outstanding URL on unmount (e.g. navigating away
    // mid-upload). Reads from the ref rather than calling setState, since a
    // setState updater queued during unmount cleanup can be dropped
    // silently, leaking the URLs.
    useEffect(() => {
      return () => {
        Object.values(thumbnailsRef.current).forEach(url => URL.revokeObjectURL(url));
      };
    }, []);

    return (
      <div className="upload-video-batch-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={`upload-video-batch-item upload-video-batch-item-${item.status}`}
            title={item.status === 'error' && item.errorMessage ? item.errorMessage : undefined}
          >
            {thumbnails[item.id] && (
              <video
                src={thumbnails[item.id]}
                className="upload-video-batch-thumb"
                muted
                preload="metadata"
              />
            )}
            <span className={`upload-video-batch-badge upload-video-batch-badge-${item.status}`}>
              {statusLabel(item)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `src/components/UploadVideoBatchGrid.css`**

  ```css
  .upload-video-batch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }

  .upload-video-batch-item {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-cream-dark);
  }

  .upload-video-batch-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .upload-video-batch-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.15rem 0.3rem;
    font-size: 0.65rem;
    font-weight: 600;
    text-align: center;
    color: white;
    background: rgba(0, 0, 0, 0.55);
  }

  .upload-video-batch-badge-pending {
    background: rgba(0, 0, 0, 0.35);
  }

  .upload-video-batch-badge-uploading {
    background: var(--color-warm-sunset-3);
  }

  .upload-video-batch-badge-success {
    background: var(--color-primary);
  }

  .upload-video-batch-badge-error {
    background: var(--color-warm-sunset-4);
  }
  ```

- [ ] **Step 3: Verify with lint (no consumer exists yet, so this is syntax/style verification only — visual verification happens in Task 2)**

  ```bash
  npx eslint src/components/UploadVideoBatchGrid.jsx
  ```
  Expected: no output (no errors or warnings).

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/UploadVideoBatchGrid.jsx src/components/UploadVideoBatchGrid.css
  git commit -m "Add UploadVideoBatchGrid component for per-video batch status"
  ```

---

## Task 2: Multi-select batch queue in UploadVideoPage

**Files:**
- Modify: `src/pages/UploadVideoPage.jsx`

**Interfaces:**
- Consumes: `UploadVideoBatchGrid` (Task 1), existing `UploadProgressBar` and `UploadSuccessScreen` (unchanged, `label`/`count` props already exist), existing `uploadVideo` from `src/lib/videosApi.js` (unchanged signature: `uploadVideo(guestName, file, onProgress)`).
- Produces: no new exports — this is the page-level integration. No changes to `src/pages/UploadPage.css` (the shared stylesheet this page imports) — every video-specific style lives in `UploadVideoBatchGrid.css`, and the existing shared rules (`.upload-review-actions`, `.upload-continue-button`, `.upload-error`, form/button base styles) are already generic and reusable as-is.

- [ ] **Step 1: Rewrite `src/pages/UploadVideoPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { uploadVideo } from '../lib/videosApi';
  import UploadProgressBar from '../components/UploadProgressBar';
  import UploadSuccessScreen from '../components/UploadSuccessScreen';
  import UploadVideoBatchGrid from '../components/UploadVideoBatchGrid';
  import ContactHelpLink from '../components/ContactHelpLink';
  import './UploadPage.css';

  const MAX_VIDEO_BATCH_SIZE = 5;
  const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];
  let nextItemId = 0;

  function validateFile(file) {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return 'That video is too large (max 250MB). Please try a shorter clip.';
    }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return "That file type isn't supported. Please upload an MP4, MOV, or WebM video.";
    }
    return '';
  }

  function createItems(files) {
    return files.map(file => {
      const errorMessage = validateFile(file);
      return {
        id: `video-item-${nextItemId++}`,
        file,
        status: errorMessage ? 'error' : 'pending',
        errorMessage,
        progress: 0,
      };
    });
  }

  export default function UploadVideoPage() {
    const [guestName, setGuestName] = useState('');
    const [items, setItems] = useState([]);
    const [phase, setPhase] = useState('idle'); // idle | uploading | review | success
    const [selectionError, setSelectionError] = useState('');

    function handleFileChange(e) {
      const selected = Array.from(e.target.files || []);
      if (selected.length > MAX_VIDEO_BATCH_SIZE) {
        setSelectionError(
          `You can upload up to ${MAX_VIDEO_BATCH_SIZE} videos at a time. Please select ${MAX_VIDEO_BATCH_SIZE} or fewer.`
        );
        setItems([]);
        setPhase('idle');
        e.target.value = '';
        return;
      }
      setSelectionError('');
      setItems(createItems(selected));
      setPhase('idle');
    }

    async function uploadItem(queueItem) {
      let lastError = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await uploadVideo(guestName.trim(), queueItem.file, percent => {
            setItems(prev =>
              prev.map(i => (i.id === queueItem.id ? { ...i, progress: percent } : i))
            );
          });
          return { status: 'success', errorMessage: '', progress: 100 };
        } catch (error) {
          lastError = error;
          const isRetryable = !error.status || error.status >= 500;
          if (attempt === 1 && isRetryable) {
            continue;
          }
          break;
        }
      }
      return {
        status: 'error',
        errorMessage: lastError?.message || 'Upload failed. Please try again.',
        progress: 0,
      };
    }

    async function runQueue(fullItems) {
      setPhase('uploading');
      const toUpload = fullItems.filter(i => i.status === 'pending');
      const results = [];
      for (const queueItem of toUpload) {
        setItems(prev =>
          prev.map(i => (i.id === queueItem.id ? { ...i, status: 'uploading', progress: 0 } : i))
        );
        const result = await uploadItem(queueItem);
        results.push(result);
        setItems(prev =>
          prev.map(i => (i.id === queueItem.id ? { ...i, ...result } : i))
        );
      }
      const preExistingFailures = fullItems.some(i => i.status === 'error');
      const anyFailed = preExistingFailures || results.some(r => r.status === 'error');
      setPhase(anyFailed ? 'review' : 'success');
    }

    async function handleSubmit(e) {
      e.preventDefault();
      const hasPendingItems = items.some(i => i.status === 'pending');
      if (phase !== 'idle' || !guestName.trim() || !hasPendingItems) return;
      await runQueue(items);
    }

    async function handleRetryFailed() {
      const failedItems = items.filter(i => i.status === 'error');
      if (failedItems.length === 0) return;
      const retryIds = new Set(failedItems.map(i => i.id));
      const resetItems = items.map(i =>
        retryIds.has(i.id) ? { ...i, status: 'pending', errorMessage: '', progress: 0 } : i
      );
      setItems(resetItems);
      await runQueue(resetItems);
    }

    function handleUploadAnother() {
      setItems([]);
      setPhase('idle');
      setSelectionError('');
    }

    const total = items.length;
    const completedCount = items.filter(i => i.status === 'success' || i.status === 'error').length;
    const successCount = items.filter(i => i.status === 'success').length;
    const failedCount = items.filter(i => i.status === 'error').length;
    const pendingCount = items.filter(i => i.status === 'pending').length;
    const overallPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    const firstFailureMessage = items.find(
      i => i.status === 'error' && i.errorMessage
    )?.errorMessage;

    function handleContinue() {
      if (successCount > 0) {
        setPhase('success');
      } else {
        handleUploadAnother();
      }
    }

    return (
      <div className="upload-page">
        <div className="upload-card">
          <img src="/camp-sign.png" alt="Camp Javery" className="upload-card-sign" />
          <h1>Share Your Videos!</h1>
          <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

          {phase === 'success' ? (
            <UploadSuccessScreen
              guestName={guestName}
              mediaType="video"
              count={successCount}
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
                disabled={phase === 'uploading' || phase === 'review'}
              />

              <label htmlFor="video">Videos</label>
              <input
                id="video"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/3gpp"
                multiple
                onChange={handleFileChange}
                required
                disabled={phase === 'uploading' || phase === 'review'}
              />

              {selectionError && (
                <p className="upload-error" role="alert">{selectionError}</p>
              )}

              {items.length > 0 && (
                <UploadProgressBar
                  percent={overallPercent}
                  label={`${completedCount}/${total} uploaded`}
                />
              )}

              {items.length > 0 && <UploadVideoBatchGrid items={items} />}

              {phase === 'review' ? (
                <div className="upload-review-actions">
                  {failedCount > 0 && firstFailureMessage && (
                    <p className="upload-error" role="alert">{firstFailureMessage}</p>
                  )}
                  {failedCount > 0 && (
                    <button type="button" onClick={handleRetryFailed}>
                      Retry {failedCount} failed video{failedCount === 1 ? '' : 's'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="upload-continue-button"
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={phase === 'uploading' || !guestName.trim() || pendingCount === 0}
                >
                  {phase === 'uploading'
                    ? 'Uploading…'
                    : pendingCount > 1
                    ? `Upload ${pendingCount} Videos`
                    : 'Upload Video'}
                </button>
              )}
            </form>
          )}
        </div>
        <ContactHelpLink />
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify single-video behavior is unchanged (regression check)**

  Per the Global Constraints backend safety note: confirm before running `npm run dev:all` whether you're testing against an isolated store or knowingly against production with a cleanup plan.

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload-video`. Select exactly 1 video. Confirm the submit button reads "Upload Video" (singular). Submit it and confirm: the overall progress bar shows `"0/1 uploaded"` then `"1/1 uploaded"`, the batch grid shows one tile with a live percentage while uploading (e.g. "Uploading… 57%") transitioning to "Uploaded", and the success screen reads "Thanks, {name}! Your video is up." with button "Upload another video" — matching the pre-batch single-video behavior.

- [ ] **Step 3: Verify a small successful batch with live progress**

  Select 2–3 videos at once. Confirm the submit button reads "Upload N Videos". Submit and confirm: the overall bar advances `"0/N uploaded"` → `"N/N uploaded"` one step at a time (proving sequential, not parallel — only one tile shows a live percentage at a time), and the success screen reads "Thanks, {name}! Your N videos are up." with button "Upload more videos".

- [ ] **Step 4: Verify the 5-video cap**

  Select 6 video files at once (duplicates of the same file are fine). Confirm: no upload starts, the message "You can upload up to 5 videos at a time. Please select 5 or fewer." appears, and the file input is effectively cleared (selecting the same 6 again re-triggers the same message rather than silently proceeding).

  While in this state, also spot-check with exactly 6 unique filenames if convenient, to rule out any accidental de-duplication — but this isn't required if duplicates already reproduced the rejection correctly.

- [ ] **Step 5: Verify a mixed valid/invalid selection**

  Select 3 files where one is invalid — either over 250MB or a non-video file renamed with a video extension so the browser assigns an unsupported MIME type (or use a file type outside `video/mp4, video/quicktime, video/webm, video/3gpp`, such as a `.avi` file). Confirm: immediately upon selection, before clicking submit, the invalid file's tile already shows "Failed" in the grid (hover shows the specific reason as a tooltip), and the submit button reads "Upload 2 Videos" (only counting the valid files). Submit and confirm the 2 valid files upload normally while the invalid one stays "Failed"; the page lands on the review screen (since the invalid file counts as a failure) showing "Retry 1 failed video" and "Continue". Click "Continue" and confirm the success screen reads "Your 2 videos are up." (not 3).

- [ ] **Step 6: Verify partial network failure and retry**

  With the backend running via `npm run dev:all`, select 3 valid videos. While the batch is uploading, stop the backend process (Ctrl+C the `npm run server` process, or kill the whole `dev:all` and restart only the frontend) after the first video has uploaded but before the rest finish, so the remaining videos fail. Confirm:
  - The page moves to the review state showing "Retry N failed videos" and "Continue" buttons.
  - The grid shows the correct mix of Uploaded / Failed tiles.

  Restart the backend (`cd server && npm run dev`), then click "Retry N failed videos". Confirm the previously-failed tiles re-run (Pending → Uploading… NN% → Uploaded) and, once all succeed, the page moves directly to the success screen (no more "review" buttons shown) reading "Your 3 videos are up."

  If you tested against production in Steps 2–6, delete the test video entries now via the admin API before finishing, per the Global Constraints backend safety note.

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/UploadVideoPage.jsx
  git commit -m "Add multi-video batch upload (up to 5) to the video upload page"
  ```

---

## Self-Review Notes

- **Spec coverage:** 5-video cap with no silent truncation → Task 2 Step 1 (`MAX_VIDEO_BATCH_SIZE`, `handleFileChange`) & Step 4; per-file validation at selection time, before any network call → Task 2 Step 1 (`validateFile`/`createItems`) & Step 5; sequential-only queue → Task 2 Step 1 (`runQueue`'s `for...of` + `await`); live per-item upload percentage → Task 1 (`statusLabel`, `item.progress`) + Task 2 Step 1 (`uploadItem`'s `onProgress` callback); overall progress bar and grid visible from selection onward (including idle phase) → Task 2 Step 1 render logic (`items.length > 0`, no phase gate); retry-failed (including pre-validation failures, which fail again deterministically) → Task 2 Step 1 (`handleRetryFailed`) & Step 6; zero-success edge case → Task 2 Step 1 (`handleContinue`); pluralized success screen → reused `UploadSuccessScreen` unchanged.
- **`UploadProgressBar`/`UploadSuccessScreen` verified as needing zero changes:** both already accept the `label`/`count` props this plan needs, added during the batch photo upload work — confirmed by reading their current source before writing this plan. No task modifies them.
- **Zero-success edge case handled:** if every video in a batch fails (or was invalid) and the guest clicks "Continue" instead of retrying, `handleContinue` resets to the idle state instead of showing a nonsensical "Your 0 videos are up." success screen (see Task 2 Step 1, `handleContinue`).
- **Type/interface consistency:** `items` shape (`{ id, file, status, errorMessage, progress }`) is identical across `UploadVideoPage.jsx`'s state and `UploadVideoBatchGrid`'s prop expectations. `UploadProgressBar`'s `label` prop and `UploadSuccessScreen`'s `count` prop match their existing (photo-batch-era) definitions exactly — no signature drift.
- **Mixed valid/invalid batches:** `runQueue` is designed to accept the *full* items array (not a pre-filtered one) and internally filter to `status === 'pending'` before uploading, so it correctly folds pre-existing validation failures into the final `anyFailed` check without re-attempting them. `handleRetryFailed` resets failed items to `pending` *before* calling `runQueue`, matching this contract — a subtle deviation from the photo plan's `runQueue` (which processes whatever list it's handed unconditionally), necessary because photos never have pre-existing failures mixed into a fresh selection the way videos can.
