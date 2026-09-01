import { useEffect, useRef, useState } from 'react';
import { uploadBoothStrip } from '../lib/photoboothApi';
import './ReviewScreen.css';

export default function ReviewScreen({ stripDataUrl, onRetake, onUploaded, idleTimeoutMs, onIdle }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | error
  const [errorMessage, setErrorMessage] = useState('');
  const idleTimerRef = useRef(null);

  useEffect(() => {
    idleTimerRef.current = setTimeout(onIdle, idleTimeoutMs);
    return () => clearTimeout(idleTimerRef.current);
  }, [idleTimeoutMs, onIdle]);

  async function handleLooksGood() {
    setStatus('uploading');
    setErrorMessage('');
    try {
      const { url } = await uploadBoothStrip(stripDataUrl);
      onUploaded(url);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Upload failed. Please try again.');
    }
  }

  return (
    <div className="screen review-screen">
      <img src={stripDataUrl} alt="Your photo strip" className="review-strip-preview" />
      {errorMessage && <p className="review-error" role="alert">{errorMessage}</p>}
      <div className="review-actions">
        <button type="button" className="review-retake-button" onClick={onRetake} disabled={status === 'uploading'}>
          Retake
        </button>
        <button type="button" className="review-continue-button" onClick={handleLooksGood} disabled={status === 'uploading'}>
          {status === 'uploading' ? 'Uploading…' : 'Looks Good'}
        </button>
      </div>
    </div>
  );
}
