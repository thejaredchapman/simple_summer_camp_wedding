import { useState } from 'react';
import { uploadVideo } from '../lib/videosApi';
import UploadProgressBar from '../components/UploadProgressBar';
import UploadSuccessScreen from '../components/UploadSuccessScreen';
import ContactHelpLink from '../components/ContactHelpLink';
import './UploadPage.css';

const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];

export default function UploadVideoPage() {
  const [guestName, setGuestName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > MAX_VIDEO_SIZE_BYTES) {
      setStatus('error');
      setErrorMessage('That video is too large (max 250MB). Please try a shorter clip.');
      setFile(null);
      return;
    }
    if (selected && !ALLOWED_VIDEO_TYPES.includes(selected.type)) {
      setStatus('error');
      setErrorMessage("That file type isn't supported. Please upload an MP4, MOV, or WebM video.");
      setFile(null);
      return;
    }
    setStatus('idle');
    setErrorMessage('');
    setFile(selected);
  }

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
      await uploadVideo(guestName.trim(), file, setProgress);
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
        <h1>Share Your Videos!</h1>
        <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

        {status === 'success' ? (
          <UploadSuccessScreen
            guestName={guestName}
            mediaType="video"
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

            <label htmlFor="video">Video</label>
            <input
              id="video"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/3gpp"
              onChange={handleFileChange}
              required
              disabled={status === 'uploading'}
            />

            {status === 'uploading' && <UploadProgressBar percent={progress} />}

            {status === 'error' && (
              <p className="upload-error" role="alert">{errorMessage}</p>
            )}

            <button type="submit" disabled={status === 'uploading' || !guestName.trim() || !file}>
              {status === 'uploading' ? 'Uploading…' : 'Upload Video'}
            </button>
          </form>
        )}
      </div>
      <ContactHelpLink />
    </div>
  );
}
