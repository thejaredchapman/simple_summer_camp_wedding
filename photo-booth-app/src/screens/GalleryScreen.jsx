import { useEffect, useState } from 'react';
import { listBoothPhotos, sendBoothEmail, shareBoothPhotoUrlBySms } from '../lib/photoboothApi';
import './GalleryScreen.css';

function SendPanel({ photo, onClose }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [emailResult, setEmailResult] = useState(null);
  const [smsOpened, setSmsOpened] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [formError, setFormError] = useState('');

  async function handleSend(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail && !trimmedPhone) {
      setFormError('Enter an email or phone number.');
      return;
    }
    setFormError('');
    setStatus('sending');

    if (trimmedEmail) {
      try {
        const result = await sendBoothEmail({
          photoUrl: photo.url,
          guestName: 'Photo Booth Guest',
          email: trimmedEmail,
        });
        setEmailResult(result.email);
      } catch (error) {
        setEmailResult({ success: false, error: error.message || 'Send failed.' });
      }
    }

    if (trimmedPhone) {
      try {
        await shareBoothPhotoUrlBySms(trimmedPhone, photo.url);
        setSmsOpened(true);
      } catch (error) {
        setSmsError(error.message || 'Could not open Messages.');
      }
    }

    setStatus('sent');
  }

  return (
    <div className="send-panel card" onClick={e => e.stopPropagation()}>
      {status !== 'sent' && (
        <form onSubmit={handleSend} className="send-panel-form">
          <label className="delivery-field" htmlFor="gallery-send-email">
            <span className="delivery-field-icon">✉️</span>
            <span className="delivery-field-input">
              <span className="delivery-field-label">Email</span>
              <input id="gallery-send-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </span>
          </label>
          <label className="delivery-field" htmlFor="gallery-send-phone">
            <span className="delivery-field-icon">💬</span>
            <span className="delivery-field-input">
              <span className="delivery-field-label">Phone number</span>
              <input id="gallery-send-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </span>
          </label>
          {formError && <p className="delivery-error" role="alert">{formError}</p>}
          <div className="send-panel-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={status === 'sending'}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}

      {status === 'sent' && (
        <div className="send-panel-result">
          {emailResult && (
            <p className={emailResult.success ? 'delivery-success' : 'delivery-error'}>
              {emailResult.success ? '✓ Emailed!' : `Email failed: ${emailResult.error}`}
            </p>
          )}
          {smsOpened && <p className="delivery-success">Opened Messages — tap Send there to finish texting it!</p>}
          {smsError && <p className="delivery-error">{smsError}</p>}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default function GalleryScreen({ onBack }) {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listBoothPhotos()
      .then(data => {
        if (!cancelled) {
          setPhotos(data);
          setStatus('ready');
        }
      })
      .catch(error => {
        if (!cancelled) {
          setErrorMessage(error.message || 'Could not load photos.');
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function closeLightbox() {
    setLightboxPhoto(null);
    setSendPanelOpen(false);
  }

  return (
    <div className="screen gallery-screen">
      <div className="app-bar">
        <button type="button" className="gallery-back-button" onClick={onBack} aria-label="Back to home">
          ←
        </button>
        <span className="app-bar-title">Photo Booth Gallery</span>
      </div>

      {status === 'loading' && <p className="gallery-status">Loading photos…</p>}
      {status === 'error' && <p className="gallery-status gallery-status-error">{errorMessage}</p>}
      {status === 'ready' && photos.length === 0 && (
        <p className="gallery-status">No strips yet — be the first!</p>
      )}

      {status === 'ready' && photos.length > 0 && (
        <div className="gallery-grid">
          {photos.map(photo => (
            <button
              key={photo.id}
              type="button"
              className="gallery-tile"
              onClick={() => setLightboxPhoto(photo)}
            >
              <img src={photo.url} alt={`Strip from ${photo.name}`} loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {lightboxPhoto && (
        <div className="gallery-lightbox" onClick={closeLightbox}>
          <img src={lightboxPhoto.url} alt={`Strip from ${lightboxPhoto.name}`} onClick={e => e.stopPropagation()} />
          {!sendPanelOpen && (
            <button
              type="button"
              className="btn btn-primary gallery-send-button"
              onClick={e => {
                e.stopPropagation();
                setSendPanelOpen(true);
              }}
            >
              ✉️💬 Send to Someone
            </button>
          )}
          {sendPanelOpen && <SendPanel photo={lightboxPhoto} onClose={closeLightbox} />}
        </div>
      )}
    </div>
  );
}
