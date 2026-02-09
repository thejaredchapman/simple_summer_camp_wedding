import { useState, useEffect } from 'react';
import { ScrollReveal } from './utils';

const heroPhotos = [
  { src: '/photos/engagement_photo.JPG', alt: 'Avery and Jared engagement photo' },
  { src: '/photos/IMG_5847.jpg', alt: 'Avery and Jared together' },
  { src: '/photos/IMG_7487.jpg', alt: 'Avery and Jared outdoor photo' },
  { src: '/photos/IMG_8961.jpg', alt: 'Avery and Jared smiling' },
  { src: '/photos/1124191356b.jpg', alt: 'Avery and Jared portrait' },
  { src: '/photos/1130191432b.jpg', alt: 'Avery and Jared candid moment' },
  { src: '/photos/IMG_0064.jpg', alt: 'Avery and Jared adventure' },
  { src: '/photos/IMG_1474.jpg', alt: 'Avery and Jared happy moment' },
  { src: '/photos/IMG_5986.jpg', alt: 'Avery and Jared together outdoors' },
  { src: '/photos/IMG_7733.jpg', alt: 'Avery and Jared enjoying nature' },
  { src: '/photos/IMG_2319.jpg', alt: 'Avery and Jared celebration' },
  { src: '/photos/IMG_4392.jpg', alt: 'Avery and Jared fun photo' },
  { src: '/photos/IMG_9693.jpg', alt: 'Avery and Jared loving moment' },
  { src: '/photos/0511191524.jpg', alt: 'Avery and Jared special day' }
];

export default function Hero() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Preload the first image
    const img = new Image();
    img.src = heroPhotos[0].src;
    img.onload = () => setIsLoaded(true);

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % heroPhotos.length);
    }, 5000); // Increased to 5 seconds for better viewing

    return () => clearInterval(interval);
  }, []);

  const handleScrollDown = () => {
    const nextSection = document.querySelector('#meet-us');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero" role="banner" aria-label="Welcome to Camp Javery">
      <div className="hero-banner" aria-hidden="true">
        {heroPhotos.map((photo, index) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            className={`hero-banner-media ${index === currentPhotoIndex ? 'active' : ''}`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content">
        <ScrollReveal animation="fade" delay={200}>
          <p className="hero-welcome">Avery & Jared invite you to</p>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={400}>
          <h2 className="hero-save-weekend">Save the Weekend</h2>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={600}>
          <div className="hero-title-box">
            <h1 className="hero-camp-name">Camp Javery</h1>
            <p className="hero-location">Camp Newaygo, MI</p>
          </div>
        </ScrollReveal>
      </div>

      <button
        className="hero-scroll-indicator"
        onClick={handleScrollDown}
        aria-label="Scroll down to explore our story"
      >
        <span>Explore Our Story</span>
        <div className="scroll-arrow" aria-hidden="true"></div>
      </button>
    </section>
  );
}
