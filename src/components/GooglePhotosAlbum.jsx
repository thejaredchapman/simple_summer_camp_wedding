import { useEffect, useState } from 'react';
import { getAlbumPreview } from '../lib/albumApi';
import './GooglePhotosAlbum.css';

const ALBUM_URL =
  'https://photos.google.com/share/AF1QipPdzWwWAusgYWOb92nfkCyRNZavjQu5bAA6dsbK4N8wduKhya_FxIsHeAblOhTVTw?key=OUxTdkVleTBXWWIweTdGSnU0dlI5RWpaeWQ4Q3RR';

export default function GooglePhotosAlbum() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAlbumPreview()
      .then(data => {
        if (!cancelled) setPhotos(data.photos || []);
      })
      .catch(() => {
        // Preview is a nice-to-have — the album link below still works if this fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="google-album">
      <a
        className="upload-share-button google-album-button"
        href={ALBUM_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        📸 Add Photos to Our Google Album
      </a>

      {photos.length > 0 && (
        <a
          className="google-album-preview-grid"
          href={ALBUM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View the full album on Google Photos"
        >
          {photos.slice(0, 12).map(url => (
            <img key={url} src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ))}
        </a>
      )}
    </div>
  );
}
