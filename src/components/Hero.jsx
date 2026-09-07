import { ScrollReveal } from './utils';

const ALBUM_URL =
  'https://photos.google.com/share/AF1QipPdzWwWAusgYWOb92nfkCyRNZavjQu5bAA6dsbK4N8wduKhya_FxIsHeAblOhTVTw?key=OUxTdkVleTBXWWIweTdGSnU0dlI5RWpaeWQ4Q3RR';

export default function Hero() {

  const handleScrollDown = () => {
    const nextSection = document.querySelector('#meet-us');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero" role="banner" aria-label="Welcome to Camp Javery">
      <div className="hero-banner" aria-hidden="true">
        <img
          src="/photos/hero-thank-you-banner.jpg"
          alt="Avery and Jared smiling together at the Camp Javery reception"
          className="hero-banner-media active"
          loading="eager"
        />
        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content-row">
        <div className="hero-content">
          <ScrollReveal animation="fade" delay={200}>
            <p className="hero-welcome">Thank you for attending</p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={400}>
            <h2 className="hero-save-weekend">Camp Javery & Club Javery</h2>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={600}>
            <p className="hero-thank-you-message">
              We appreciate all of the love, friendships, pets, and frogs.
              <br />
              Thank you for the memories.
              <br />
              Photos to come soon!
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={700}>
            <a
              className="hero-cta"
              href={ALBUM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              📸 Add &amp; View Photos
            </a>
          </ScrollReveal>
        </div>

        <ScrollReveal animation="fade-up" delay={800} className="hero-side-photo-wrap">
          <div className="hero-main-image hero-thank-you-image hero-side-photo">
            <img
              src="/photos/just-married.jpg"
              alt="Avery and Jared's hands on the 'Just Married' back window of their car"
              className="hero-camp-sign"
              loading="eager"
            />
          </div>
        </ScrollReveal>
      </div>

      <button
        className="hero-scroll-indicator"
        onClick={handleScrollDown}
        aria-label="Scroll down to explore our story"
      >
        <span>Explore Our Story</span>
        <div className="scroll-arrow" aria-hidden="true"></div>
      </button>
    </section>
  );
}
