import { ScrollReveal } from './utils';

export default function RSVP() {
  return (
    <section id="rsvp" className="rsvp" aria-labelledby="rsvp-heading">
      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="rsvp-heading">RSVP</h2>
          <p className="section-subtitle">Please fill out this form to RSVP for Camp Javery!</p>
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={100}>
        <div className="rsvp-content">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd9i64ZNtFV6FZsqw6ZLnghPk1Ob1-gmErMyngljA1UmWjgBQ/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="rsvp-button"
          >
            RSVP Now
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
