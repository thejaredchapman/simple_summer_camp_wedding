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
