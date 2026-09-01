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
  const [filter, setFilter] = useState('all'); // 'all' | 'photo-booth'

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

  const filteredPhotos = filter === 'all' ? photos : photos.filter(p => p.source === 'photo-booth');

  return (
    <div className="gallery-page">
      <h1>Camp Javery Photos</h1>
      <Link to="/upload" className="gallery-upload-button">
        Upload More Photos
      </Link>
      <div className="gallery-filter-tabs">
        <button
          type="button"
          className={filter === 'all' ? 'gallery-filter-tab gallery-filter-tab-active' : 'gallery-filter-tab'}
          onClick={() => setFilter('all')}
        >
          All Photos
        </button>
        <button
          type="button"
          className={filter === 'photo-booth' ? 'gallery-filter-tab gallery-filter-tab-active' : 'gallery-filter-tab'}
          onClick={() => setFilter('photo-booth')}
        >
          Photo Booth
        </button>
      </div>
      {error && <p className="gallery-error">{error}</p>}
      <div className="gallery-grid">
        {filteredPhotos.map(photo => (
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
      {filteredPhotos.length === 0 && !error && (
        <p className="gallery-empty">
          {filter === 'photo-booth' ? 'No photo booth strips yet!' : 'No photos yet — be the first to share one!'}
        </p>
      )}
      <ContactHelpLink />
      {lightboxPhotoId && (() => {
        const lightboxIndex = filteredPhotos.findIndex(p => p.id === lightboxPhotoId);
        if (lightboxIndex === -1) return null;
        return (
          <PhotoLightbox
            key={lightboxPhotoId}
            photos={filteredPhotos}
            index={lightboxIndex}
            onClose={() => setLightboxPhotoId(null)}
            onIndexChange={i => setLightboxPhotoId(filteredPhotos[i]?.id ?? null)}
          />
        );
      })()}
    </div>
  );
}
