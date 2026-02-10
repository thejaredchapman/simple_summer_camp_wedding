import { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/camp-sign.png';
    link.download = 'camp-javery-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <footer className="footer">

      <div className="footer-content">
        <div className="footer-logo-wrapper">
          <img
            src="/camp-sign.png"
            alt="Camp Javery"
            className="footer-logo-image footer-logo-clickable"
            onClick={() => setIsModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
          />
          <p className="footer-logo-hint">Click to expand</p>
        </div>

        <h3 className="footer-tagline">See you at camp!</h3>

        <p className="footer-date">September 3-6, 2026 | Camp Newaygo, MI</p>

        <nav className="footer-nav">
          <a href="#home">Home</a>
          <a href="#schedule">Schedule</a>
        </nav>

        <div className="footer-contact">
          <p>Questions? Reach out to us:</p>
          <a href="mailto:javery.chapmanwine@gmail.com">
            javery.chapmanwine@gmail.com
          </a>
        </div>

        <p className="footer-copyright">
          Made with love for Camp Javery © {currentYear}
        </p>

        <p className="footer-hashtag">#CampJavery2026</p>
      </div>

      {isModalOpen && (
        <div className="logo-modal-overlay" onClick={handleModalClose}>
          <div className="logo-modal">
            <button
              className="logo-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <img
              src="/camp-sign.png"
              alt="Camp Javery"
              className="logo-modal-image"
            />
            <button className="btn-primary logo-download-btn" onClick={handleDownload}>
              Download Logo
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
