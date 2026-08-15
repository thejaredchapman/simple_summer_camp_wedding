# Batch Photo Upload (up to 30 at once) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a guest select up to 30 photos at once on `/upload` and have them upload sequentially with visible per-photo status, instead of one photo per submission.

**Architecture:** No backend changes — the existing `POST /api/photos/upload` endpoint already handles one file per request, so a batch is just `UploadPage.jsx` calling the existing `uploadPhoto()` client once per selected file, in a sequential loop with a small queue state machine. Two existing shared components (`UploadProgressBar`, `UploadSuccessScreen`) get small backward-compatible prop extensions; one new component (`UploadBatchGrid`) shows per-photo thumbnails and status.

**Tech Stack:** Same as the rest of the repo — React 19, plain component state (`useState`), no new dependencies.

## Global Constraints

- No backend changes. `POST /api/photos/upload` is unchanged; the photo rate limiter stays at 100 uploads/10min/IP (already enough for a 30-photo batch plus retries).
- Videos are out of scope — `/upload-video` (`src/pages/UploadVideoPage.jsx`) is not touched by this plan.
- Uploads run strictly sequentially, one at a time — never concurrent.
- `MAX_BATCH_SIZE = 30`. Selecting more is rejected client-side with a message; the app never silently truncates to the first 30.
- No automated test framework in this repo — every step's verification is a manual command (`node -e`, `npx eslint`) or a browser check via `npm run dev:all`.
- Follow existing conventions: PascalCase `.jsx` + matching `.css`, pages in `src/pages/`, shared cross-page UI in `src/components/`, API clients in `src/lib/`.
- `UploadProgressBar`'s new `label` prop and `UploadSuccessScreen`'s new `count` prop must be fully backward-compatible — existing callers that don't pass them (`UploadVideoPage.jsx`, and any single-photo use) must render byte-for-byte identical output.

---

## Task 1: Extend shared components for batch support

**Files:**
- Modify: `src/components/UploadProgressBar.jsx`
- Modify: `src/components/UploadSuccessScreen.jsx`

**Interfaces:**
- Produces:
  - `UploadProgressBar({ percent: number, label?: string })` — when `label` is omitted, renders `${percent}%` exactly as before. When provided, renders `label` instead (e.g. `"12/30 uploaded"`).
  - `UploadSuccessScreen({ guestName: string, mediaType: "photo"|"video", count?: number, onUploadAnother: () => void })` — `count` defaults to `1`. At `count === 1`, copy is unchanged ("Thanks, {guestName}! Your {mediaType} is up." / "Upload another {mediaType}"). At `count > 1`, copy pluralizes ("Thanks, {guestName}! Your {count} {mediaType}s are up." / "Upload more {mediaType}s").
- Consumes: nothing new.

- [ ] **Step 1: Update `src/components/UploadProgressBar.jsx`**

  Replace the full file with:
  ```jsx
  import './UploadProgressBar.css';

  export default function UploadProgressBar({ percent, label }) {
    return (
      <div
        className="upload-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="upload-progress-mask" style={{ width: `${100 - percent}%` }} />
        <span className="upload-progress-label">{label ?? `${percent}%`}</span>
      </div>
    );
  }
  ```

- [ ] **Step 2: Update `src/components/UploadSuccessScreen.jsx`**

  Replace the full file with:
  ```jsx
  import './UploadSuccessScreen.css';

  export default function UploadSuccessScreen({ guestName, mediaType, count = 1, onUploadAnother }) {
    const isPlural = count > 1;
    return (
      <div className="upload-success">
        <p>
          Thanks, {guestName}!{' '}
          {isPlural
            ? `Your ${count} ${mediaType}s are up.`
            : `Your ${mediaType} is up.`}
        </p>
        <button type="button" onClick={onUploadAnother}>
          {isPlural ? `Upload more ${mediaType}s` : `Upload another ${mediaType}`}
        </button>
      </div>
    );
  }
  ```

- [ ] **Step 3: Verify existing single-photo and video pages are unaffected**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload` (this is still the old single-photo version — Task 3 rewrites it). Submit one real photo. Confirm the progress bar shows a plain percentage (e.g. `47%`, not `undefined` or blank), and the success screen reads exactly "Thanks, {name}! Your photo is up." with a button labeled "Upload another photo".

  Then open `http://localhost:5173/upload-video` and repeat with a short test video. Confirm identical behavior: percentage-only progress bar, and "Thanks, {name}! Your video is up." / "Upload another video".

  Both must look and read exactly as they did before this task — this proves the new `label`/`count` props are additive, not breaking.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/UploadProgressBar.jsx src/components/UploadSuccessScreen.jsx
  git commit -m "Extend UploadProgressBar and UploadSuccessScreen for batch upload support"
  ```

---

## Task 2: Per-photo status grid component

**Files:**
- Create: `src/components/UploadBatchGrid.jsx`
- Create: `src/components/UploadBatchGrid.css`

**Interfaces:**
- Produces: `UploadBatchGrid({ items: Array<{ id: string, file: File, status: "pending"|"uploading"|"success"|"error" }> })` — renders one thumbnail tile per item with a status badge. No callbacks; purely presentational.
- Consumes: nothing — takes plain `File` objects and builds its own object URLs for thumbnails, revoking them appropriately.

- [ ] **Step 1: Write `src/components/UploadBatchGrid.jsx`**

  ```jsx
  import { useEffect, useState } from 'react';
  import './UploadBatchGrid.css';

  const STATUS_LABEL = {
    pending: 'Pending',
    uploading: 'Uploading…',
    success: 'Uploaded',
    error: 'Failed',
  };

  export default function UploadBatchGrid({ items }) {
    const [thumbnails, setThumbnails] = useState({});

    // Only create a thumbnail URL the first time an item's id appears, and
    // revoke URLs for ids that are no longer present. This deliberately does
    // NOT recreate URLs on every status change (pending -> uploading ->
    // success), since `items` gets a new array reference on every queue
    // update but the underlying File objects don't change.
    useEffect(() => {
      setThumbnails(prev => {
        const next = { ...prev };
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

        return next;
      });
    }, [items]);

    // Revoke every outstanding URL on unmount (e.g. navigating away mid-upload).
    useEffect(() => {
      return () => {
        setThumbnails(current => {
          Object.values(current).forEach(url => URL.revokeObjectURL(url));
          return current;
        });
      };
    }, []);

    return (
      <div className="upload-batch-grid">
        {items.map(item => (
          <div key={item.id} className={`upload-batch-item upload-batch-item-${item.status}`}>
            {thumbnails[item.id] && (
              <img src={thumbnails[item.id]} alt="" className="upload-batch-thumb" />
            )}
            <span className={`upload-batch-badge upload-batch-badge-${item.status}`}>
              {STATUS_LABEL[item.status]}
            </span>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 2: Write `src/components/UploadBatchGrid.css`**

  ```css
  .upload-batch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }

  .upload-batch-item {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-cream-dark);
  }

  .upload-batch-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .upload-batch-badge {
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

  .upload-batch-badge-pending {
    background: rgba(0, 0, 0, 0.35);
  }

  .upload-batch-badge-uploading {
    background: var(--color-warm-sunset-3);
  }

  .upload-batch-badge-success {
    background: var(--color-primary);
  }

  .upload-batch-badge-error {
    background: var(--color-warm-sunset-4);
  }
  ```

- [ ] **Step 3: Verify with lint (no consumer exists yet, so this is syntax/style verification only — visual verification happens in Task 3)**

  ```bash
  npx eslint src/components/UploadBatchGrid.jsx
  ```
  Expected: no output (no errors or warnings).

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/UploadBatchGrid.jsx src/components/UploadBatchGrid.css
  git commit -m "Add UploadBatchGrid component for per-photo batch status"
  ```

---

## Task 3: Multi-select batch queue in UploadPage

**Files:**
- Modify: `src/pages/UploadPage.jsx`
- Modify: `src/pages/UploadPage.css`

**Interfaces:**
- Consumes: `UploadProgressBar` (Task 1), `UploadSuccessScreen` (Task 1), `UploadBatchGrid` (Task 2), existing `compressPhoto` from `src/lib/compressImage.js`, existing `uploadPhoto` from `src/lib/photosApi.js` (unchanged signature: `uploadPhoto(guestName, file, onProgress?)`).
- Produces: no new exports — this is the page-level integration.

- [ ] **Step 1: Rewrite `src/pages/UploadPage.jsx`**

  ```jsx
  import { useState } from 'react';
  import { compressPhoto } from '../lib/compressImage';
  import { uploadPhoto } from '../lib/photosApi';
  import UploadProgressBar from '../components/UploadProgressBar';
  import UploadSuccessScreen from '../components/UploadSuccessScreen';
  import UploadBatchGrid from '../components/UploadBatchGrid';
  import ContactHelpLink from '../components/ContactHelpLink';
  import './UploadPage.css';

  const MAX_BATCH_SIZE = 30;
  let nextItemId = 0;

  function createItems(files) {
    return files.map(file => ({
      id: `item-${nextItemId++}`,
      file,
      status: 'pending',
      errorMessage: '',
    }));
  }

  export default function UploadPage() {
    const [guestName, setGuestName] = useState('');
    const [items, setItems] = useState([]);
    const [phase, setPhase] = useState('idle'); // idle | uploading | review | success
    const [selectionError, setSelectionError] = useState('');

    function handleFileChange(e) {
      const selected = Array.from(e.target.files || []);
      if (selected.length > MAX_BATCH_SIZE) {
        setSelectionError(
          `You can upload up to ${MAX_BATCH_SIZE} photos at a time. Please select ${MAX_BATCH_SIZE} or fewer.`
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
          const compressed = await compressPhoto(queueItem.file);
          await uploadPhoto(guestName.trim(), compressed);
          return { status: 'success', errorMessage: '' };
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
      };
    }

    async function runQueue(queueItems) {
      setPhase('uploading');
      const results = [];
      for (const queueItem of queueItems) {
        setItems(prev =>
          prev.map(i => (i.id === queueItem.id ? { ...i, status: 'uploading' } : i))
        );
        const result = await uploadItem(queueItem);
        results.push(result);
        setItems(prev =>
          prev.map(i => (i.id === queueItem.id ? { ...i, ...result } : i))
        );
      }
      const anyFailed = results.some(r => r.status === 'error');
      setPhase(anyFailed ? 'review' : 'success');
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!guestName.trim() || items.length === 0) return;
      await runQueue(items);
    }

    async function handleRetryFailed() {
      const failedItems = items.filter(i => i.status === 'error');
      if (failedItems.length === 0) return;
      setItems(prev =>
        prev.map(i => (i.status === 'error' ? { ...i, status: 'pending', errorMessage: '' } : i))
      );
      await runQueue(failedItems);
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
    const overallPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

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
          <h1>Share Your Photos!</h1>
          <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

          {phase === 'success' ? (
            <UploadSuccessScreen
              guestName={guestName}
              mediaType="photo"
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
                disabled={phase === 'uploading'}
              />

              <label htmlFor="photo">Photos</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                required
                disabled={phase === 'uploading'}
              />

              {selectionError && (
                <p className="upload-error" role="alert">{selectionError}</p>
              )}

              {phase === 'uploading' && (
                <UploadProgressBar
                  percent={overallPercent}
                  label={`${completedCount}/${total} uploaded`}
                />
              )}

              {items.length > 0 && (phase === 'uploading' || phase === 'review') && (
                <UploadBatchGrid items={items} />
              )}

              {phase === 'review' ? (
                <div className="upload-review-actions">
                  {failedCount > 0 && (
                    <button type="button" onClick={handleRetryFailed}>
                      Retry {failedCount} failed photo{failedCount === 1 ? '' : 's'}
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
                  disabled={phase === 'uploading' || !guestName.trim() || items.length === 0}
                >
                  {phase === 'uploading'
                    ? 'Uploading…'
                    : items.length > 1
                    ? `Upload ${items.length} Photos`
                    : 'Upload Photo'}
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

- [ ] **Step 2: Update `src/pages/UploadPage.css`**

  Append at the end of the file:
  ```css
  .upload-review-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }

  .upload-review-actions button {
    margin-top: 0;
  }

  .upload-continue-button {
    background: var(--color-cream-dark);
    color: var(--color-text);
  }

  .upload-form button.upload-continue-button:hover {
    background: var(--color-warm-sunset-2);
  }
  ```

- [ ] **Step 3: Verify single-photo behavior is unchanged (regression check)**

  ```bash
  npm run dev:all
  ```
  Open `http://localhost:5173/upload`. Select exactly 1 photo. Confirm the submit button reads "Upload Photo" (singular). Submit it and confirm: the progress bar shows `"1/1 uploaded"`, the batch grid shows one thumbnail transitioning Pending → Uploading… → Uploaded, and the success screen reads "Thanks, {name}! Your photo is up." with button "Upload another photo" — matching the pre-batch single-photo behavior.

- [ ] **Step 4: Verify a small successful batch**

  Select 3–5 photos at once. Confirm the submit button reads "Upload N Photos". Submit and confirm: the overall bar advances `"0/N uploaded"` → `"N/N uploaded"` one step at a time (not all at once — proving they're sequential, not parallel), each grid tile moves Pending → Uploading… → Uploaded in order (only one tile "Uploading…" at a time), and the success screen reads "Thanks, {name}! Your N photos are up." with button "Upload more photos".

- [ ] **Step 5: Verify the 30-photo cap**

  Select 31 files at once (any 31 image files — duplicates of the same file are fine for this check). Confirm: no upload starts, the message "You can upload up to 30 photos at a time. Please select 30 or fewer." appears, and the file input is effectively cleared (selecting the same 31 again re-triggers the same message rather than silently proceeding).

- [ ] **Step 6: Verify partial failure and retry**

  With the backend running via `npm run dev:all`, select 3 photos. While the batch is uploading, stop the backend process (Ctrl+C the `npm run server` process, or kill the whole `dev:all` and restart only the frontend) after the first photo has uploaded but before the rest finish, so the remaining photos fail. Confirm:
  - The page moves to the review state showing "Retry N failed photos" and "Continue" buttons.
  - The grid shows the correct mix of Uploaded / Failed tiles.

  Restart the backend (`cd server && npm run dev`), then click "Retry N failed photos". Confirm the previously-failed tiles re-run (Pending → Uploading… → Uploaded) and, once all succeed, the page moves directly to the success screen (no more "review" buttons shown) reading "Your 3 photos are up."

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/UploadPage.jsx src/pages/UploadPage.css
  git commit -m "Add multi-photo batch upload (up to 30) to the upload page"
  ```

---

## Self-Review Notes

- **Spec coverage:** selection & validation (30-cap, no silent truncation) → Task 3 Steps 1 & 5; sequential queue with existing retry-once-on-5xx logic → Task 3 Step 1 (`uploadItem`/`runQueue`); overall progress bar with count label → Task 1 Step 1 + Task 3; per-photo grid → Task 2; retry-failed / continue-past-failures → Task 3 Step 1 (`handleRetryFailed`/`handleContinue`) and Step 6; pluralized success screen → Task 1 Step 2 + Task 3.
- **Backward compatibility verified explicitly:** Task 1 Step 3 exercises the *old* `UploadPage.jsx` and the untouched `UploadVideoPage.jsx` against the *new* shared components before `UploadPage.jsx` itself changes in Task 3 — this is the only way to prove the prop extensions are additive rather than assuming it.
- **Zero-success edge case handled:** if every photo in a batch fails and the guest clicks "Continue" instead of retrying, `handleContinue` resets to the idle state instead of showing a nonsensical "Your 0 photos are up." success screen (see Task 3 Step 1, `handleContinue`).
- **Type/interface consistency:** `items` shape (`{ id, file, status, errorMessage }`) is identical across `UploadPage.jsx`'s state and `UploadBatchGrid`'s prop expectations. `UploadProgressBar`'s `label` and `UploadSuccessScreen`'s `count` prop names match between their Task 1 definitions and their Task 3 call sites.
