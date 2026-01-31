export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-banner">
        <img
          src="/photos/engagement_photo.JPG"
          alt="Avery & Jared Engagement"
          className="hero-banner-media"
        />
        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content">
        <p className="hero-welcome">Avery & Jared invite you to</p>
        <h2 className="hero-save-weekend">Save the Weekend</h2>

        <div className="hero-title-box">
          <h1 className="hero-camp-name">Camp Javery</h1>
          <p className="hero-location">Camp Newaygo, MI</p>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>Explore Our Story</span>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
}
