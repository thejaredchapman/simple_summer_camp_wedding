import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPhotos } from '../lib/photosApi';
import ContactHelpLink from '../components/ContactHelpLink';
import PhotoLightbox from '../components/PhotoLightbox';
import './GalleryPage.css';

const POLL_INTERVAL_MS = 20000;

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  // Tracked by id, not array index — the list re-sorts on every poll as new
  // photos arrive, so an index would silently point at the wrong photo.
  const [lightboxPhotoId, setLightboxPhotoId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPhotos() {
      try {
        const data = await listPhotos();
        if (!cancelled) {
          setPhotos(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    fetchPhotos();
    const interval = setInterval(fetchPhotos, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="gallery-page">
      <h1>Camp Javery Photos</h1>
      <Link to="/upload" className="gallery-upload-button">
        Upload More Photos
      </Link>
      {error && <p className="gallery-error">{error}</p>}
      <div className="gallery-grid">
        {photos.map(photo => (
          <button
            key={photo.id}
            type="button"
            className="gallery-item"
            onClick={() => setLightboxPhotoId(photo.id)}
          >
            <img
              src={photo.url}
              alt={`Photo from ${photo.name}`}
              loading="lazy"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
            <span className="gallery-item-name">{photo.name}</span>
          </button>
        ))}
      </div>
      {photos.length === 0 && !error && (
        <p className="gallery-empty">No photos yet — be the first to share one!</p>
      )}
      <ContactHelpLink />
      {lightboxPhotoId && (() => {
        const lightboxIndex = photos.findIndex(p => p.id === lightboxPhotoId);
        if (lightboxIndex === -1) return null;
        return (
          <PhotoLightbox
            key={lightboxPhotoId}
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxPhotoId(null)}
            onIndexChange={i => setLightboxPhotoId(photos[i]?.id ?? null)}
          />
        );
      })()}
    </div>
  );
}
