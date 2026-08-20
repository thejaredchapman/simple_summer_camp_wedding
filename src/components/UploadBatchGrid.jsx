import { useEffect, useRef, useState } from 'react';
import './UploadBatchGrid.css';

const STATUS_LABEL = {
  pending: 'Pending',
  uploading: 'Uploading…',
  success: 'Uploaded',
  error: 'Failed',
};

// Shows the specific failure reason on the tile itself rather than relying
// solely on the `title` tooltip, which touch devices have no way to reveal.
function badgeLabel(item) {
  if (item.status === 'error') {
    return item.errorMessage || STATUS_LABEL.error;
  }
  return STATUS_LABEL[item.status];
}

export default function UploadBatchGrid({ items }) {
  const [thumbnails, setThumbnails] = useState({});
  // Mirrors `thumbnails` so the unmount-cleanup effect below can revoke
  // every outstanding URL by reading the ref directly, instead of going
  // through a setState updater that may never run on an unmounting fiber.
  const thumbnailsRef = useRef({});

  // Only create a thumbnail URL the first time an item's id appears, and
  // revoke URLs for ids that are no longer present. This deliberately does
  // NOT recreate URLs on every status change (pending -> uploading ->
  // success), since `items` gets a new array reference on every queue
  // update but the underlying File objects don't change.
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
    // External resource (Blob URL) sync + cleanup on prop change, not
    // derivable render state — the ref above is the source of truth for
    // cleanup; this setState only drives the visible <img> re-render.
    // (No eslint-disable needed here: since `next` is computed from the
    // ref rather than the previous `thumbnails` state, the
    // react-hooks/set-state-in-effect rule no longer flags this call.)
    setThumbnails(next);
  }, [items]);

  // Revoke every outstanding URL on unmount (e.g. navigating away mid-upload,
  // or the grid unmounting because `phase` flips to `success`). Reads from
  // the ref rather than calling setState, since a setState updater queued
  // during unmount cleanup can be dropped silently, leaking the URLs.
  useEffect(() => {
    return () => {
      Object.values(thumbnailsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="upload-batch-grid">
      {items.map(item => (
        <div
          key={item.id}
          className={`upload-batch-item upload-batch-item-${item.status}`}
          title={item.status === 'error' && item.errorMessage ? item.errorMessage : undefined}
        >
          {thumbnails[item.id] && (
            <img src={thumbnails[item.id]} alt="" className="upload-batch-thumb" />
          )}
          <span className={`upload-batch-badge upload-batch-badge-${item.status}`}>
            {badgeLabel(item)}
          </span>
        </div>
      ))}
    </div>
  );
}
