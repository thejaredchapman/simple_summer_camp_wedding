import { Lantern } from './decorations';

export default function ContactUs() {
  return (
    <section id="contact" className="contact-us">
      <Lantern className="contact-lantern contact-lantern-left" />
      <Lantern className="contact-lantern contact-lantern-right" />

      <div className="section-header">
        <h2>Contact Us</h2>
        <p className="section-subtitle">Have questions? We'd love to hear from you!</p>
      </div>

      <div className="contact-content">
        <div className="contact-card">
          <div className="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h3>Email Us</h3>
          <p>For any questions about the wedding weekend, accommodations, or anything else:</p>
          <a href="mailto:campjavery@email.com" className="contact-link">
            campjavery@email.com
          </a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h3>The Venue</h3>
          <p>Camp Newaygo</p>
          <p className="contact-address">
            5333 S Centerline Rd<br />
            Newaygo, MI 49337
          </p>
          <a
            href="https://www.google.com/maps/place/Camp+Newaygo/@43.4410609,-85.8910881,11z/data=!4m10!1m2!2m1!1sCamp+Newaygo+6525+E+76th+St+Newaygo+MI+49337!3m6!1s0x88193cf1a15f5be5:0x6e58c14b7fb961ec!8m2!3d43.4571658!4d-85.799198!15sCixDYW1wIE5ld2F5Z28gNjUyNSBFIDc2dGggU3QgTmV3YXlnbyBNSSA0OTMzN1ouIixjYW1wIG5ld2F5Z28gNjUyNSBlIDc2dGggc3QgbmV3YXlnbyBtaSA0OTMzN5IBBGNhbXCaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMnBvUjFKNlNsSmpNbEY1Wkd4Q1NtRXlhM1JqUjJReFZtcE9XbFpZWXhBQuABAPoBBQj_ARBJ!16s%2Fg%2F1vvyypqv?entry=ttu&g_ep=EgoyMDI2MDExMy4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            View on Map
          </a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3>Wedding Weekend</h3>
          <p className="contact-date">Labor Day Weekend 2026</p>
          <p>September 3-6, 2026</p>
          <p className="contact-note">Please RSVP by March 1st, 2026</p>
        </div>
      </div>

      <div className="contact-message">
        <p>We can't wait to celebrate with you at Camp Javery!</p>
        <span className="contact-hashtag">#CampJavery2026</span>
      </div>
    </section>
  );
}
