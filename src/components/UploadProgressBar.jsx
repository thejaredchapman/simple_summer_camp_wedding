import './UploadProgressBar.css';

export default function UploadProgressBar({ percent, label }) {
  return (
    <div
      className="upload-progress-track"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="upload-progress-mask" style={{ width: `${100 - percent}%` }} />
      <span className="upload-progress-label">{label ?? `${percent}%`}</span>
    </div>
  );
}
