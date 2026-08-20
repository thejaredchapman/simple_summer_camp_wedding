import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    const validationError = validateFile(queueItem.file);
    if (validationError) {
      return { status: 'error', errorMessage: validationError, progress: 0 };
    }
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
        <p className="upload-gallery-link">
          <Link to="/videos">View the Videos</Link>
        </p>

        {phase === 'success' ? (
          <UploadSuccessScreen
            guestName={guestName}
            mediaType="video"
            count={successCount}
            onUploadAnother={() => navigate('/videos')}
            actionLabel="View Videos"
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

            {failedCount > 0 && firstFailureMessage && (
              <p className="upload-error" role="alert">{firstFailureMessage}</p>
            )}

            {phase !== 'idle' && items.length > 0 && (
              <UploadProgressBar
                percent={overallPercent}
                label={`${completedCount}/${total} uploaded`}
              />
            )}

            {phase === 'uploading' && (
              <p className="upload-patience-note">
                Please be patient — this may take a moment.
              </p>
            )}

            {items.length > 0 && <UploadVideoBatchGrid items={items} />}

            {phase === 'review' ? (
              <div className="upload-review-actions">
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
