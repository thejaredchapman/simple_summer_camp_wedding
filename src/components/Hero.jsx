import { useState, useEffect } from 'react';

const heroPhotos = [
  '/photos/engagement_photo.JPG',
  '/photos/IMG_5847.jpg',
  '/photos/IMG_7487.jpg',
  '/photos/IMG_8961.jpg',
  '/photos/1124191356b.jpg',
  '/photos/1130191432b.jpg',
  '/photos/IMG_0064.jpg',
  '/photos/IMG_1474.jpg',
  '/photos/IMG_5986.jpg',
  '/photos/IMG_7733.jpg',
  '/photos/IMG_2319.jpg',
  '/photos/IMG_4392.jpg',
  '/photos/IMG_9693.jpg',
  '/photos/0511191524.jpg'
];

export default function Hero() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % heroPhotos.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="hero">
      <div className="hero-banner">
        {heroPhotos.map((photo, index) => (
          <img
            key={photo}
            src={photo}
            alt={`Avery & Jared ${index + 1}`}
            className={`hero-banner-media ${index === currentPhotoIndex ? 'active' : ''}`}
          />
        ))}
        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content">
        <p className="hero-welcome">Avery & Jared invite you to</p>
        <h2 className="hero-save-weekend">Save the Weekend</h2>

        <div className="hero-title-box">
          <h1 className="hero-camp-name">Camp Javery</h1>
          <p className="hero-location">Camp Newaygo, MI</p>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>Explore Our Story</span>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
}
