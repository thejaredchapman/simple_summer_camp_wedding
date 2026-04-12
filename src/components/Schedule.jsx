import { Lantern } from './decorations';
import { ScrollReveal } from './utils';

const scheduleItems = [
  {
    day: 'Thursday, September 3',
    subtitle: 'Welcome to Camp',
    description: "Jared & Avery arrive to kick off the festivities. If you're staying at Camp Newaygo, pitch your tent, settle in, and warm up your vocal cords for a karaoke and camp fires.",
    events: [
      { time: '4:30 PM', name: 'Camp Check-In' },
      { time: '6:30 PM', name: 'Dinner & Karaoke' },
    ]
  },
  {
    day: 'Friday, September 4',
    subtitle: 'Day of Fun',
    description: 'A full day of classic summer camp fun - games, crafts, and plenty of time to relax and hang out.',
    events: [
      { time: '10:00 AM', name: 'Day of Fun Games' },
      { time: '12:00 PM', name: 'Lunch — Sandwich Shop Open' },
      { time: '1:00–5:00 PM', name: 'Free Time (Swimming, Arts & Crafts)' },
      { time: '6:00 PM', name: 'Night of Fun — BBQ Dinner & Drinks' },
    ]
  },
  {
    day: 'Saturday, September 5',
    subtitle: 'Wedding Day',
    description: "We say \"I do!\". Wedding ceremony and reception celebrations at Camp Newaygo. Can't wait to celebrate with you!",
    events: [
      { time: '3:33 PM', name: 'Wedding Ceremony & Reception to Follow' },
    ]
  },
  {
    day: 'Sunday, September 6',
    subtitle: 'Farewell Brunch',
    description: "Head home with a heart full of memories and maybe a few s'mores. We hope to see you again at the next campfire! :) #CampersRollout",
    events: [
      { time: '9:00 AM', name: 'Farewell Brunch' },
      { time: '11:00 AM', name: 'Camp Checkout' },
    ]
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
                <p className="schedule-subtitle">{item.subtitle}</p>
                <p className="schedule-description">{item.description}</p>
                <ul className="schedule-events">
                  {item.events.map((event, i) => (
                    <li key={i} className="schedule-event">
                      <span className="schedule-event-time">{event.time}</span>
                      <span className="schedule-event-sep" aria-hidden="true">—</span>
                      <span className="schedule-event-name">{event.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
