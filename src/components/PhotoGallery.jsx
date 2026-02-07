import { useState } from 'react';
import { Lantern } from './decorations';

const galleryPhotos = [
  { src: '/photos/engagement_photo.JPG', alt: 'Avery & Jared Engagement' },
  { src: '/photos/0511191515c.jpg', alt: 'Avery & Jared' },
  { src: '/photos/0511191524.jpg', alt: 'Avery & Jared' },
  { src: '/photos/1124191356b.jpg', alt: 'Avery & Jared' },
  { src: '/photos/1130191432b.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_0064.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_0364.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_1386 (1).jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_1474.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_2319.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_3692.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_4392.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_4420.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_5847.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_5986.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_6532.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_7267.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_7487.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_7733.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_8961.jpg', alt: 'Avery & Jared' },
  { src: '/photos/IMG_9693.jpg', alt: 'Avery & Jared' }
];

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openPhoto = (index) => {
    setCurrentIndex(index);
    setSelectedPhoto(galleryPhotos[index]);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % galleryPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(galleryPhotos[newIndex]);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(galleryPhotos[newIndex]);
  };

  return (
    <section id="photos" className="photo-gallery-section">
      <Lantern className="gallery-lantern gallery-lantern-left" />
      <Lantern className="gallery-lantern gallery-lantern-right" />

      <div className="section-header">
        <h2>Our Photo Gallery</h2>
        <p className="section-subtitle">Memories from our journey together</p>
      </div>

      <div className="photo-gallery-grid">
        {galleryPhotos.map((photo, index) => (
          <div
            key={index}
            className="gallery-photo-item"
            onClick={() => openPhoto(index)}
          >
            <img src={photo.src} alt={photo.alt} />
            <div className="gallery-photo-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={closePhoto}>
          <button
            className="photo-modal-close"
            onClick={closePhoto}
            aria-label="Close photo"
          >
            ×
          </button>

          <button
            className="photo-modal-nav photo-modal-prev"
            onClick={prevPhoto}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.src} alt={selectedPhoto.alt} />
            <div className="photo-modal-counter">
              {currentIndex + 1} / {galleryPhotos.length}
            </div>
          </div>

          <button
            className="photo-modal-nav photo-modal-next"
            onClick={nextPhoto}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
