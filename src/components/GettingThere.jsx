import { Lantern } from './decorations';
import { ScrollReveal } from './utils';

const destination = 'Camp+Newaygo,+Newaygo,+MI';

const airports = [
  {
    name: "O'Hare International Airport",
    code: 'ORD',
    origin: 'O%27Hare+International+Airport,+Chicago,+IL',
    link: 'https://maps.app.goo.gl/xndp5kzJdFTuCzQq9',
  },
  {
    name: 'Detroit Metropolitan Wayne County Airport',
    code: 'DTW',
    origin: 'Detroit+Metropolitan+Wayne+County+Airport,+MI',
    link: 'https://maps.app.goo.gl/HNcuHzDYyR9e3PoK7',
  },
  {
    name: 'Gerald R. Ford International Airport',
    code: 'GRR',
    origin: 'Gerald+R.+Ford+International+Airport,+Grand+Rapids,+MI',
    link: 'https://maps.app.goo.gl/k49rUWXnUC1xzxmM9',
  },
];

export default function GettingThere() {
  return (
    <section id="getting-there" className="getting-there" aria-labelledby="getting-there-heading">
      <Lantern className="getting-there-lantern getting-there-lantern-left" />
      <Lantern className="getting-there-lantern getting-there-lantern-right" />

      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="getting-there-heading">Getting There</h2>
          <p className="section-subtitle">
            Camp Newaygo is located in beautiful northern Michigan. Here are driving directions from the closest airports.
          </p>
        </div>
      </ScrollReveal>

      <div className="getting-there-grid">
        {airports.map((airport, index) => (
          <ScrollReveal key={airport.code} animation="fade-up" delay={index * 150}>
            <div className="getting-there-card">
              <h3>{airport.name} ({airport.code})</h3>
              <iframe
                className="getting-there-map"
                title={`Directions from ${airport.name} to Camp Newaygo`}
                src={`https://www.google.com/maps?saddr=${airport.origin}&daddr=${destination}&output=embed`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={airport.link}
                target="_blank"
                rel="noopener noreferrer"
                className="getting-there-link"
              >
                Open in Google Maps →
              </a>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
