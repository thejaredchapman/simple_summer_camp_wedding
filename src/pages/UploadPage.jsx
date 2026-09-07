import { Link } from 'react-router-dom';
import ContactHelpLink from '../components/ContactHelpLink';
import './UploadPage.css';

const SHARE_EMAIL = 'javery.chapmanwine@gmail.com';
const SHARE_PHONE_DISPLAY = '(213) 476-7529';
const SHARE_PHONE_LINK = '+12134767529';

export default function UploadPage() {
  return (
    <div className="upload-page">
      <Link to="/" className="upload-home-button">
        🏠 Home
      </Link>
      <div className="upload-card">
        <img src="/camp-sign.png" alt="Camp Javery" className="upload-card-sign" />
        <h1>Share Your Photos &amp; Videos!</h1>
        <p className="upload-subtitle">Camp Javery — Jared &amp; Avery's Wedding</p>
        <p className="upload-hashtag">#CampJavery</p>
        <p className="upload-gallery-link">
          <Link to="/gallery">View the Gallery</Link>
          {' · '}
          <Link to="/videos">View the Videos</Link>
        </p>

        <p className="upload-share-intro">
          Send us your favorite photos and videos from the weekend — we'd love to see them!
        </p>

        <div className="upload-share-options">
          <a className="upload-share-button" href={`mailto:${SHARE_EMAIL}?subject=${encodeURIComponent('Camp Javery Photos & Videos')}`}>
            📧 Email {SHARE_EMAIL}
          </a>
          <a className="upload-share-button upload-share-button-secondary" href={`sms:${SHARE_PHONE_LINK}`}>
            💬 Text {SHARE_PHONE_DISPLAY}
          </a>
        </div>
      </div>
      <ContactHelpLink />
    </div>
  );
}
