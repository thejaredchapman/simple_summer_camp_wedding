import './UploadSuccessScreen.css';

export default function UploadSuccessScreen({ guestName, mediaType, count = 1, onUploadAnother }) {
  const isPlural = count > 1;
  return (
    <div className="upload-success">
      <p>
        Thanks, {guestName}!{' '}
        {isPlural
          ? `Your ${count} ${mediaType}s are up.`
          : `Your ${mediaType} is up.`}
      </p>
      <button type="button" onClick={onUploadAnother}>
        {isPlural ? `Upload more ${mediaType}s` : `Upload another ${mediaType}`}
      </button>
    </div>
  );
}
