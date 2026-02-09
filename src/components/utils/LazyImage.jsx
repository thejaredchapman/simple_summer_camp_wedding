import { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * Lazy loads images when they enter the viewport using Intersection Observer
 * Provides loading states and smooth fade-in transitions
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholderSrc = null,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${!isLoaded ? 'loading' : ''}`}
    >
      <img
        src={isInView ? src : (placeholderSrc || '')}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : ''}`}
        onLoad={handleLoad}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

export default LazyImage;
