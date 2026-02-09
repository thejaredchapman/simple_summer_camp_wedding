import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal Component
 * Reveals children with animation when they enter the viewport
 * Supports multiple animation types
 */
const ScrollReveal = ({
  children,
  animation = 'fade-up', // 'fade-up', 'fade-left', 'fade-right', 'fade', 'stagger'
  threshold = 0.1,
  rootMargin = '0px',
  delay = 0,
  className = '',
  triggerOnce = true,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsRevealed(true);
            }, delay);

            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsRevealed(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, rootMargin, delay, triggerOnce]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'fade-left':
        return 'scroll-reveal-left';
      case 'fade-right':
        return 'scroll-reveal-right';
      case 'fade':
        return 'scroll-reveal-fade';
      case 'stagger':
        return 'scroll-reveal-stagger';
      default:
        return 'scroll-reveal';
    }
  };

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClass()} ${isRevealed ? 'revealed' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
