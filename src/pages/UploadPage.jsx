import { useState } from 'react';
import { compressPhoto } from '../lib/compressImage';
import { uploadPhoto } from '../lib/photosApi';
import './UploadPage.css';

export default function UploadPage() {
  const [guestName, setGuestName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!guestName.trim() || !file) return;
    await attemptUpload(1);
  }

  async function attemptUpload(attempt) {
    setStatus('uploading');
    setErrorMessage('');
    try {
      const compressed = await compressPhoto(file);
      await uploadPhoto(guestName.trim(), compressed);
      setStatus('success');
    } catch (error) {
      if (attempt < 2) {
        return attemptUpload(attempt + 1);
      }
      setStatus('error');
      setErrorMessage(error.message || 'Upload failed. Please try again.');
    }
  }

  function handleUploadAnother() {
    setStatus('idle');
    setFile(null);
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h1>Share Your Photos!</h1>
        <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>

        {status === 'success' ? (
          <div className="upload-success">
            <p>Thanks, {guestName}! Your photo is up.</p>
            <button type="button" onClick={handleUploadAnother}>
              Upload another photo
            </button>
          </div>
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
              capture="environment"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
              disabled={status === 'uploading'}
            />

            {status === 'error' && (
              <p className="upload-error" role="alert">{errorMessage}</p>
            )}

            <button type="submit" disabled={status === 'uploading' || !guestName.trim() || !file}>
              {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
