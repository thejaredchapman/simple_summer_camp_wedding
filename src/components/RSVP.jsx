import { ScrollReveal } from './utils';

export default function RSVP() {
  return (
    <section id="rsvp" className="rsvp" aria-labelledby="rsvp-heading">
      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="rsvp-heading">RSVP</h2>
          <p className="section-subtitle">RSVPs are now closed. Thank you to everyone who responded!</p>
        </div>
      </ScrollReveal>
    </section>
  );
}
