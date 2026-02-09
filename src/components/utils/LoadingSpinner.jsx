/**
 * LoadingSpinner Component
 * Simple, accessible loading spinner
 */
const LoadingSpinner = ({ size = 40, className = '', ariaLabel = 'Loading' }) => {
  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      className={`loading-spinner ${className}`}
      style={spinnerStyle}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default LoadingSpinner;
