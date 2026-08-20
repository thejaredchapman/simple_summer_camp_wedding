import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { getPhotoMetadata } from '../lib/photosApi';
import './PhotoLightbox.css';

const SWIPE_THRESHOLD_PX = 50;

const METADATA_LABELS = {
  Make: 'Camera Make',
  Model: 'Camera Model',
  LensModel: 'Lens',
  FocalLength: 'Focal Length',
  FNumber: 'Aperture',
  ExposureTime: 'Shutter Speed',
  ISO: 'ISO',
  Flash: 'Flash',
  DateTimeOriginal: 'Date Taken',
  ExifImageWidth: 'Width',
  ExifImageHeight: 'Height',
  Orientation: 'Orientation',
  Software: 'Software',
};

const METADATA_FIELD_ORDER = Object.keys(METADATA_LABELS);

function formatMetadataValue(field, value) {
  switch (field) {
    case 'FocalLength':
      return `${value}mm`;
    case 'FNumber':
      return `f/${value}`;
    case 'ExposureTime':
      return value < 1 ? `1/${Math.round(1 / value)}s` : `${value}s`;
    case 'ISO':
      return `ISO ${value}`;
    case 'DateTimeOriginal': {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    }
    case 'ExifImageWidth':
    case 'ExifImageHeight':
      return `${value}px`;
    default:
      return String(value);
  }
}

export default function PhotoLightbox({ photos, index, onClose, onIndexChange }) {
  const photo = photos[index];
  const touchStartX = useRef(null);

  // The parent renders this component keyed by photo.id, so navigating to a
  // different photo remounts it and these reset to their initial values
  // automatically — no manual reset effect needed.
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataState, setMetadataState] = useState('idle'); // idle | loading | loaded | empty | error
  const [metadata, setMetadata] = useState(null);

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > SWIPE_THRESHOLD_PX) {
      goPrev();
    } else if (deltaX < -SWIPE_THRESHOLD_PX) {
      goNext();
    }
    touchStartX.current = null;
  }

  async function handleToggleMetadata() {
    const opening = !metadataOpen;
    setMetadataOpen(opening);
    if (opening && metadataState === 'idle') {
      setMetadataState('loading');
      try {
        const data = await getPhotoMetadata(photo.id);
        setMetadata(data);
        setMetadataState(data ? 'loaded' : 'empty');
      } catch {
        setMetadataState('error');
      }
    }
  }

  if (!photo) return null;

  return (
    <div className="photo-lightbox" onClick={onClose}>
      <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="Close">
        &times;
      </button>

      <button
        type="button"
        className="photo-lightbox-info-toggle"
        onClick={e => {
          e.stopPropagation();
          handleToggleMetadata();
        }}
        aria-label="Show photo details"
        aria-pressed={metadataOpen}
      >
        &#9432; Details
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          className="photo-lightbox-nav photo-lightbox-prev"
          onClick={e => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous photo"
        >
          &lsaquo;
        </button>
      )}

      <div
        className="photo-lightbox-content"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={photo.url} alt={`Photo from ${photo.name}`} />
        <span className="photo-lightbox-caption">{photo.name}</span>

        {metadataOpen && (
          <div className="photo-lightbox-metadata">
            <dl>
              <dt>Uploaded by</dt>
              <dd>{photo.name}</dd>
              <dt>Uploaded</dt>
              <dd>{new Date(photo.uploadedAt).toLocaleString()}</dd>
            </dl>

            {metadataState === 'loading' && (
              <p className="photo-lightbox-metadata-status">Loading photo details…</p>
            )}
            {metadataState === 'error' && (
              <p className="photo-lightbox-metadata-status">Couldn't load photo details.</p>
            )}
            {metadataState === 'empty' && (
              <p className="photo-lightbox-metadata-status">
                No camera details available for this photo.
              </p>
            )}
            {metadataState === 'loaded' && metadata && (
              <dl>
                {METADATA_FIELD_ORDER.filter(field => metadata[field] !== undefined).map(field => (
                  <Fragment key={field}>
                    <dt>{METADATA_LABELS[field]}</dt>
                    <dd>{formatMetadataValue(field, metadata[field])}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <button
          type="button"
          className="photo-lightbox-nav photo-lightbox-next"
          onClick={e => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next photo"
        >
          &rsaquo;
        </button>
      )}
    </div>
  );
}
