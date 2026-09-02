import { useEffect, useState } from 'react';
import { listBoothPhotos } from '../lib/photoboothApi';
import './GalleryScreen.css';

export default function GalleryScreen({ onBack }) {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

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
        <div className="gallery-lightbox" onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto.url} alt={`Strip from ${lightboxPhoto.name}`} />
        </div>
      )}
    </div>
  );
}
