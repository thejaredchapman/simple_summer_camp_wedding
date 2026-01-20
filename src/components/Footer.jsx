export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">

      <div className="footer-content">
        <div className="footer-logo-wrapper">
          <img
            src="/camp-sign.png"
            alt="Camp Javery"
            className="footer-logo-image"
          />
        </div>

        <h3 className="footer-tagline">See you at camp!</h3>

        <p className="footer-date">September 3-6, 2026 | Camp Newaygo, MI</p>

        <nav className="footer-nav">
          <a href="#home">Home</a>
          <a href="#rsvp">RSVP</a>
        </nav>

        <div className="footer-contact">
          <p>Questions? Reach out to us:</p>
          <a href="mailto:campjavery@email.com">
            campjavery@email.com
          </a>
        </div>

        <p className="footer-copyright">
          Made with love for Camp Javery © {currentYear}
        </p>

        <p className="footer-hashtag">#CampJavery2026</p>
      </div>
    </footer>
  );
}
