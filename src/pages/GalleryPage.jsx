import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPhotos } from '../lib/photosApi';
import ContactHelpLink from '../components/ContactHelpLink';
import './GalleryPage.css';

const POLL_INTERVAL_MS = 20000;

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

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
          <a
            key={photo.id}
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            className="gallery-item"
          >
            <img src={photo.url} alt={`Photo from ${photo.name}`} loading="lazy" />
            <span className="gallery-item-name">{photo.name}</span>
          </a>
        ))}
      </div>
      {photos.length === 0 && !error && (
        <p className="gallery-empty">No photos yet — be the first to share one!</p>
      )}
      <ContactHelpLink />
    </div>
  );
}
