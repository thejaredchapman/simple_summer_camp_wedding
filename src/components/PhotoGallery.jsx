import { useState, useEffect, useMemo } from 'react';
import { Lantern } from './decorations';
import { LazyImage, ScrollReveal } from './utils';

const galleryPhotosData = [
  { src: '/photos/engagement_photo.JPG', alt: 'Avery and Jared engagement photo' },
  { src: '/photos/0511191515c.jpg', alt: 'Avery and Jared together' },
  { src: '/photos/0511191524.jpg', alt: 'Avery and Jared outdoor portrait' },
  { src: '/photos/0703192342b.jpg', alt: 'Avery and Jared night out' },
  { src: '/photos/1124191356b.jpg', alt: 'Avery and Jared casual photo' },
  { src: '/photos/1130191432b.jpg', alt: 'Avery and Jared enjoying time together' },
  { src: '/photos/IMG_0064.jpg', alt: 'Avery and Jared adventure moment' },
  { src: '/photos/IMG_0364.jpg', alt: 'Avery and Jared smiling' },
  { src: '/photos/IMG_1386 (1).jpg', alt: 'Avery and Jared candid moment' },
  { src: '/photos/IMG_1474.jpg', alt: 'Avery and Jared portrait' },
  { src: '/photos/IMG_2319.jpg', alt: 'Avery and Jared celebration photo' },
  { src: '/photos/IMG_3532.jpg', alt: 'Avery and Jared memorable moment' },
  { src: '/photos/IMG_3692.jpg', alt: 'Avery and Jared fun photo' },
  { src: '/photos/IMG_4153.jpg', alt: 'Avery and Jared sweet moment' },
  { src: '/photos/IMG_4392.jpg', alt: 'Avery and Jared happy together' },
  { src: '/photos/IMG_4420.jpg', alt: 'Avery and Jared scenic photo' },
  { src: '/photos/IMG_5847.jpg', alt: 'Avery and Jared outdoor photo' },
  { src: '/photos/IMG_5986.jpg', alt: 'Avery and Jared travel photo' },
  { src: '/photos/IMG_6532.jpg', alt: 'Avery and Jared special moment' },
  { src: '/photos/IMG_7267.jpg', alt: 'Avery and Jared loving moment' },
  { src: '/photos/IMG_7487.jpg', alt: 'Avery and Jared enjoying nature' },
  { src: '/photos/IMG_7733.jpg', alt: 'Avery and Jared beautiful day' },
  { src: '/photos/IMG_8961.jpg', alt: 'Avery and Jared cozy moment' },
  { src: '/photos/IMG_9693.jpg', alt: 'Avery and Jared fun times' },
  { src: '/photos/IMG_20190421_131703_797.jpg', alt: 'Avery and Jared spring day' },
  { src: '/photos/IMG_20191221_160126.jpg', alt: 'Avery and Jared winter moment' },
  { src: '/photos/PXL_20201122_155056683.jpg', alt: 'Avery and Jared together' },
  { src: '/photos/IMG_20200730_211623.jpg', alt: 'Avery and Jared summer evening' }
];

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Shuffle photos once on mount
  const galleryPhotos = useMemo(() => {
    const shuffled = [...galleryPhotosData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const openPhoto = (index) => {
    setCurrentIndex(index);
    setSelectedPhoto(galleryPhotos[index]);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = (e) => {
    e?.stopPropagation();
    const newIndex = (currentIndex + 1) % galleryPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(galleryPhotos[newIndex]);
  };

  const prevPhoto = (e) => {
    e?.stopPropagation();
    const newIndex = (currentIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(galleryPhotos[newIndex]);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPhoto, currentIndex]);

  return (
    <section id="photos" className="photo-gallery-section" aria-labelledby="photo-gallery-heading">
      <Lantern className="gallery-lantern gallery-lantern-left" />
      <Lantern className="gallery-lantern gallery-lantern-right" />

      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="photo-gallery-heading">Our Photo Gallery</h2>
          <p className="section-subtitle">Memories from our journey together</p>
        </div>
      </ScrollReveal>

      <div className="photo-gallery-grid" role="list">
        {galleryPhotos.map((photo, index) => (
          <ScrollReveal
            key={index}
            animation="fade-up"
            delay={index * 50}
            threshold={0.1}
          >
            <div
              className="gallery-photo-item hover-lift"
              onClick={() => openPhoto(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPhoto(index);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View ${photo.alt}`}
            >
              <LazyImage src={photo.src} alt={photo.alt} threshold={0.1} />
              <div className="gallery-photo-overlay" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="photo-modal-overlay"
          onClick={closePhoto}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-photo-title"
        >
          <button
            className="photo-modal-close"
            onClick={closePhoto}
            aria-label="Close photo viewer"
          >
            ×
          </button>

          <button
            className="photo-modal-nav photo-modal-prev"
            onClick={prevPhoto}
            aria-label="View previous photo"
          >
            ‹
          </button>

          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              id="modal-photo-title"
            />
            <div className="photo-modal-counter" aria-live="polite">
              Photo {currentIndex + 1} of {galleryPhotos.length}
            </div>
          </div>

          <button
            className="photo-modal-nav photo-modal-next"
            onClick={nextPhoto}
            aria-label="View next photo"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
