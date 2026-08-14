import { useState } from 'react';
import { compressPhoto } from '../lib/compressImage';
import { uploadPhoto } from '../lib/photosApi';
import UploadProgressBar from '../components/UploadProgressBar';
import UploadSuccessScreen from '../components/UploadSuccessScreen';
import ContactHelpLink from '../components/ContactHelpLink';
import './UploadPage.css';

export default function UploadPage() {
  const [guestName, setGuestName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!guestName.trim() || !file) return;
    await attemptUpload(1);
  }

  async function attemptUpload(attempt) {
    setStatus('uploading');
    setErrorMessage('');
    setProgress(0);
    try {
      const compressed = await compressPhoto(file);
      await uploadPhoto(guestName.trim(), compressed, setProgress);
      setStatus('success');
    } catch (error) {
      const isRetryable = !error.status || error.status >= 500;
      if (attempt < 2 && isRetryable) {
        return attemptUpload(attempt + 1);
      }
      setStatus('error');
      setErrorMessage(error.message || 'Upload failed. Please try again.');
    }
  }

  function handleUploadAnother() {
    setStatus('idle');
    setFile(null);
    setProgress(0);
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <img src="/camp-sign.png" alt="Camp Javery" className="upload-card-sign" />
        <h1>Share Your Photos!</h1>
        <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

        {status === 'success' ? (
          <UploadSuccessScreen
            guestName={guestName}
            mediaType="photo"
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
              disabled={status === 'uploading'}
            />

            <label htmlFor="photo">Photo</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
              disabled={status === 'uploading'}
            />

            {status === 'uploading' && <UploadProgressBar percent={progress} />}

            {status === 'error' && (
              <p className="upload-error" role="alert">{errorMessage}</p>
            )}

            <button type="submit" disabled={status === 'uploading' || !guestName.trim() || !file}>
              {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
            </button>
          </form>
        )}
      </div>
      <ContactHelpLink />
    </div>
  );
}
