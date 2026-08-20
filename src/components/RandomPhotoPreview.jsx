import { useEffect, useState } from 'react';
import { listPhotos } from '../lib/photosApi';
import './RandomPhotoPreview.css';

const PREVIEW_COUNT = 6;

function pickRandom(photos, count) {
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function RandomPhotoPreview() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listPhotos()
      .then(data => {
        if (!cancelled) setPhotos(pickRandom(data, PREVIEW_COUNT));
      })
      .catch(() => {
        // This is a lightweight teaser, not core to the upload flow — if
        // photos can't be loaded, just skip it instead of surfacing an
        // error on the upload page.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <div className="random-photo-preview">
      {photos.map(photo => (
        <img
          key={photo.id}
          src={photo.url}
          alt=""
          loading="lazy"
          className="random-photo-preview-thumb"
          draggable={false}
          onContextMenu={e => e.preventDefault()}
        />
      ))}
    </div>
  );
}
