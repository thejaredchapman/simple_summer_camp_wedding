import { useEffect, useState } from 'react';
import './UploadBatchGrid.css';

const STATUS_LABEL = {
  pending: 'Pending',
  uploading: 'Uploading…',
  success: 'Uploaded',
  error: 'Failed',
};

export default function UploadBatchGrid({ items }) {
  const [thumbnails, setThumbnails] = useState({});

  // Only create a thumbnail URL the first time an item's id appears, and
  // revoke URLs for ids that are no longer present. This deliberately does
  // NOT recreate URLs on every status change (pending -> uploading ->
  // success), since `items` gets a new array reference on every queue
  // update but the underlying File objects don't change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThumbnails(prev => {
      const next = { ...prev };
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

      return next;
    });
  }, [items]);

  // Revoke every outstanding URL on unmount (e.g. navigating away mid-upload).
  useEffect(() => {
    return () => {
      setThumbnails(current => {
        Object.values(current).forEach(url => URL.revokeObjectURL(url));
        return current;
      });
    };
  }, []);

  return (
    <div className="upload-batch-grid">
      {items.map(item => (
        <div key={item.id} className={`upload-batch-item upload-batch-item-${item.status}`}>
          {thumbnails[item.id] && (
            <img src={thumbnails[item.id]} alt="" className="upload-batch-thumb" />
          )}
          <span className={`upload-batch-badge upload-batch-badge-${item.status}`}>
            {STATUS_LABEL[item.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
