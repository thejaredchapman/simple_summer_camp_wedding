import { Lantern } from './decorations';
import { ScrollReveal } from './utils';

const scheduleItems = [
  {
    day: 'Thursday, September 3',
    description: 'Jared & Avery arrive to kick off the festivities. If you\'re staying at Camp Newaygo, pitch your tent, settle in, and warm up your vocal cords for a karaoke and camp fires.'
  },
  {
    day: 'Friday, September 4',
    description: 'A full day of classic summer camp fun - games, crafts, and plenty of time to relax and hang out.'
  },
  {
    day: 'Saturday, September 5',
    description: 'We say "I do!". Wedding ceremony and reception celebrations at Camp Newaygo. Can\'t wait to celebrate with you!'
  },
  {
    day: 'Sunday, September 6',
    description: 'Head home with a heart full of memories and maybe a few s\'mores. We hope to see you again at the next campfire! :) #CampersRollout'
  }
];

export default function Schedule() {
  return (
    <section id="schedule" className="schedule" aria-labelledby="schedule-heading">
      <Lantern className="schedule-lantern schedule-lantern-left" />
      <Lantern className="schedule-lantern schedule-lantern-right" />

      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="schedule-heading">Camp Schedule</h2>
          <p className="section-subtitle">Full schedule to be provided closer to the date!</p>
          <p className="section-tagline">We hope you can join us for some or all of our wedding weekend fun!</p>
        </div>
      </ScrollReveal>

      <div className="schedule-timeline">
        {scheduleItems.map((item, index) => (
          <ScrollReveal key={index} animation="fade-left" delay={index * 100}>
            <div className="schedule-item">
            <div className="schedule-marker">
              <div className="schedule-dot"></div>
              {index < scheduleItems.length - 1 && <div className="schedule-line"></div>}
            </div>
              <div className="schedule-content">
                <h3 className="schedule-day">{item.day}</h3>
                <p className="schedule-description">{item.description}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
