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
  rootMargin = '100px',
  eager = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (eager || !imgRef.current) return;

    const currentRef = imgRef.current;

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

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [threshold, rootMargin, eager]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${!isLoaded ? 'loading' : ''} ${hasError ? 'error' : ''}`}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
