/**
 * OptimizedImage - serves WebP with srcset when optimized versions exist,
 * falling back to the original src for browsers that don't support WebP.
 */
function getOptimizedPath(src) {
  // /photos/IMG_1234.jpg -> /photos/optimized/IMG_1234
  const lastSlash = src.lastIndexOf('/');
  const dir = src.substring(0, lastSlash);
  const filename = src.substring(lastSlash + 1);
  const name = filename.substring(0, filename.lastIndexOf('.'));
  return `${dir}/optimized/${name}`;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  sizes = '(max-width: 480px) 400px, (max-width: 1024px) 800px, 1200px',
  eager = false,
  ...props
}) {
  const base = getOptimizedPath(src);

  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`${base}-400w.webp 400w, ${base}-800w.webp 800w, ${base}-1200w.webp 1200w`}
        sizes={sizes}
      />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </picture>
  );
}
