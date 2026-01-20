export default function Hero() {
  return (
    <section id="home" className="hero">
      {/* Full-screen banner background - replace src with your photo or video */}
      <div className="hero-banner">
        {/* Option 1: Photo banner (default) */}
        <img
          src="/hero-banner.svg"
          alt="Camp Javery Wedding"
          className="hero-banner-media"
        />

        {/* Option 2: Video banner - uncomment below and comment out the img above to use video */}
        {/* <video
          className="hero-banner-media"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-banner.jpg"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video> */}

        <div className="hero-banner-overlay"></div>
      </div>

      <div className="hero-content">
        <p className="hero-welcome">Avery & Jared invite you to</p>
        <h2 className="hero-save-weekend">Save the Weekend</h2>

        <div className="hero-title-box">
          <h1 className="hero-camp-name">Camp Javery</h1>
          <p className="hero-location">Camp Newaygo, MI</p>
        </div>

        <a href="#rsvp" className="hero-cta">
          RSVP Now
        </a>
      </div>

      <div className="hero-scroll-indicator">
        <span>Explore Our Story</span>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
}
