import { useEffect, useRef, useState } from 'react';
import './UploadVideoBatchGrid.css';

const STATUS_LABEL = {
  pending: 'Pending',
  uploading: 'Uploading…',
  success: 'Uploaded',
  error: 'Failed',
};

// Shows the specific failure reason on the tile itself rather than relying
// solely on the `title` tooltip, which touch devices have no way to reveal.
function statusLabel(item) {
  if (item.status === 'uploading') {
    return `Uploading… ${item.progress ?? 0}%`;
  }
  if (item.status === 'error') {
    return item.errorMessage || STATUS_LABEL.error;
  }
  return STATUS_LABEL[item.status];
}

export default function UploadVideoBatchGrid({ items }) {
  const [thumbnails, setThumbnails] = useState({});
  // Mirrors `thumbnails` so the unmount-cleanup effect below can revoke
  // every outstanding URL by reading the ref directly, instead of going
  // through a setState updater that may never run on an unmounting fiber.
  const thumbnailsRef = useRef({});

  // Only create a thumbnail URL the first time an item's id appears, and
  // revoke URLs for ids that are no longer present. This deliberately does
  // NOT recreate URLs on every status/progress change (pending ->
  // uploading -> success), since `items` gets a new array reference on
  // every queue update but the underlying File objects don't change.
  useEffect(() => {
    const next = { ...thumbnailsRef.current };
    const currentIds = new Set(items.map(item => item.id));

    items.forEach(item => {
      if (!next[item.id]) {
        next[item.id] = URL.createObjectURL(item.file);
      }
    });

    Object.keys(next).forEach(id => {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(next[id]);
        delete next[id];
      }
    });

    thumbnailsRef.current = next;
    setThumbnails(next);
  }, [items]);

  // Revoke every outstanding URL on unmount (e.g. navigating away
  // mid-upload). Reads from the ref rather than calling setState, since a
  // setState updater queued during unmount cleanup can be dropped
  // silently, leaking the URLs.
  useEffect(() => {
    return () => {
      Object.values(thumbnailsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="upload-video-batch-grid">
      {items.map(item => (
        <div
          key={item.id}
          className={`upload-video-batch-item upload-video-batch-item-${item.status}`}
          title={item.status === 'error' && item.errorMessage ? item.errorMessage : undefined}
        >
          {thumbnails[item.id] && (
            <video
              src={`${thumbnails[item.id]}#t=0.1`}
              className="upload-video-batch-thumb"
              muted
              playsInline
              preload="metadata"
            />
          )}
          <span className={`upload-video-batch-badge upload-video-batch-badge-${item.status}`}>
            {statusLabel(item)}
          </span>
        </div>
      ))}
    </div>
  );
}
