import { useCallback, useEffect, useRef } from 'react';
import './PhotoLightbox.css';

const SWIPE_THRESHOLD_PX = 50;

export default function PhotoLightbox({ photos, index, onClose, onIndexChange }) {
  const photo = photos[index];
  const touchStartX = useRef(null);

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

  if (!photo) return null;

  return (
    <div className="photo-lightbox" onClick={onClose}>
      <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="Close">
        &times;
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
