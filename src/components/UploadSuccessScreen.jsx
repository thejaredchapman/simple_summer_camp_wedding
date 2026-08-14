import './UploadSuccessScreen.css';

export default function UploadSuccessScreen({ guestName, mediaType, onUploadAnother }) {
  return (
    <div className="upload-success">
      <p>Thanks, {guestName}! Your {mediaType} is up.</p>
      <button type="button" onClick={onUploadAnother}>
        Upload another {mediaType}
      </button>
    </div>
  );
}
