import { ScrollReveal } from './utils';

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
          src="/photos/engagement_photo banner.JPG"
          alt="Avery and Jared engagement photo"
          className="hero-banner-media active"
          loading="eager"
        />
        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content">
        <ScrollReveal animation="fade" delay={200}>
          <p className="hero-welcome">Avery & Jared invite you to</p>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={400}>
          <h2 className="hero-save-weekend">Save the Weekend</h2>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={600}>
          <div className="hero-title-box">
            <h1 className="hero-camp-name">Camp Javery</h1>
            <p className="hero-location">Camp Newaygo, MI</p>
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
