import { useState } from 'react';
import { Smores } from './decorations';

// Day icons matching the Save the Date
const dayIcons = {
  tent: (
    <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2" className="day-icon">
      <path d="M20 2 L2 28 L38 28 Z" />
      <path d="M20 2 L20 28" />
      <path d="M14 28 L14 20 Q17 17 20 20 Q23 17 26 20 L26 28" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  ),
  activities: (
    <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2" className="day-icon">
      {/* Binoculars */}
      <circle cx="12" cy="15" r="8" />
      <circle cx="28" cy="15" r="8" />
      <path d="M20 12 L20 18" />
      <circle cx="12" cy="15" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="28" cy="15" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  rings: (
    <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2.5" className="day-icon">
      <circle cx="14" cy="15" r="10" />
      <circle cx="26" cy="15" r="10" />
    </svg>
  ),
  departure: (
    <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2" className="day-icon">
      <path d="M5 25 L20 5 L35 25" />
      <path d="M12 25 L20 12 L28 25" fill="currentColor" opacity="0.3" />
      <circle cx="20" cy="8" r="3" fill="currentColor" />
    </svg>
  )
};

const scheduleData = [
  {
    day: 'Thursday',
    date: 'September 3rd',
    theme: 'Arrival Day',
    emoji: '🏕️',
    icon: 'tent',
    activities: [
      { time: '2:00 PM - 6:00 PM', name: 'Check-in & Cabin Setup', location: 'Main Lodge', description: 'Javery arrives to begin their weekend! Get settled into your cabin and explore the grounds.' },
      { time: '6:30 PM', name: 'Karaoke Pizza Party', location: 'Dining Hall', description: 'Pitch your tents & join us for a karaoke pizza party to kick off the festivities!' },
      { time: '9:00 PM', name: 'Opening Campfire', location: 'Lakeside Fire Pit', description: 'S\'mores, stories, and stargazing to welcome everyone to Camp Javery!' }
    ]
  },
  {
    day: 'Friday',
    date: 'September 4th',
    theme: 'Camp Activities Day',
    emoji: '🎯',
    icon: 'activities',
    activities: [
      { time: '8:00 AM - 10:00 AM', name: 'Breakfast', location: 'Dining Hall', description: 'Fuel up for a full day of fun!' },
      { time: '10:00 AM - 12:00 PM', name: 'Morning Activities', location: 'Camp Grounds', description: 'Choose your own adventure: hiking, canoeing, archery, arts & crafts, and more!' },
      { time: '12:00 PM - 1:00 PM', name: 'Lunch', location: 'Dining Hall', description: 'Refuel and swap stories from the morning.' },
      { time: '1:00 PM - 5:00 PM', name: 'Afternoon Fun', location: 'Camp Grounds', description: 'More camp activities, swimming, lawn games, or just relax by the lake!' },
      { time: '6:00 PM', name: 'Camp Dinner', location: 'Outdoor Pavilion', description: 'Casual dinner together under the stars.' },
      { time: '8:00 PM', name: 'Evening Entertainment', location: 'Lakeside', description: 'Games, campfire, and quality time before the big day!' }
    ]
  },
  {
    day: 'Saturday',
    date: 'September 5th',
    theme: 'Wedding Day',
    emoji: '💒',
    icon: 'rings',
    highlight: true,
    activities: [
      { time: '8:00 AM - 10:00 AM', name: 'Breakfast', location: 'Dining Hall', description: 'Leisurely morning breakfast.' },
      { time: '10:00 AM - 3:00 PM', name: 'Free Time', location: 'Camp Grounds', description: 'Relax and get ready for the big event!' },
      { time: '4:00 PM', name: 'The Ceremony', location: 'Eagle\'s Nest Meadow', description: 'We say "I do!" Join us as Avery & Jared exchange vows under the open sky.', highlight: true },
      { time: '5:00 PM', name: 'Cocktail Hour', location: 'Garden Terrace', description: 'Drinks, appetizers, and celebration while the newlyweds take photos.' },
      { time: '6:30 PM', name: 'Reception & Dinner', location: 'Pinewood Lodge', description: 'Dinner, toasts, and dancing the night away!' },
      { time: '10:00 PM', name: 'Late Night Snacks & Dancing', location: 'Pinewood Lodge', description: 'Keep the party going with late-night treats!' }
    ]
  },
  {
    day: 'Sunday',
    date: 'September 6th',
    theme: 'Departure Day',
    emoji: '👋',
    icon: 'departure',
    activities: [
      { time: '8:00 AM - 11:00 AM', name: 'Farewell Brunch', location: 'Dining Hall', description: 'Sleep in and enjoy a final brunch together.' },
      { time: '11:00 AM - 1:00 PM', name: 'Check-out', location: 'Main Lodge', description: 'Pack up and say your goodbyes.' },
      { time: 'All Day', name: 'Safe Travels!', location: 'Everywhere', description: 'Thank you for celebrating with us! See you at the next adventure! 💕' }
    ]
  }
];

export default function EventDetails() {
  const [expandedDay, setExpandedDay] = useState(null);

  const toggleDay = (index) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  return (
    <section id="details" className="event-details">
      <div className="section-header">
        <h2>Camp Schedule</h2>
        <p className="section-subtitle">September 3rd - 6th, 2026</p>
      </div>

      <p className="schedule-intro">
        Click on each day to see the full schedule of activities!
      </p>

      <div className="day-cards-container">
        {scheduleData.map((dayData, index) => (
          <div
            key={index}
            className={`day-card ${expandedDay === index ? 'expanded' : ''} ${dayData.highlight ? 'wedding-day' : ''}`}
            onClick={() => toggleDay(index)}
          >
            <div className="day-card-header">
              <div className="day-icon-wrapper">
                {dayIcons[dayData.icon]}
              </div>
              <div className="day-info">
                <h3 className="day-name">{dayData.day}</h3>
                <span className="day-date">{dayData.date}</span>
              </div>
              <span className="day-theme">{dayData.theme}</span>
              <span className="expand-icon">{expandedDay === index ? '−' : '+'}</span>
            </div>

            <div className="day-card-content">
              <div className="activities-list">
                {dayData.activities.map((activity, actIndex) => (
                  <div key={actIndex} className={`activity-item ${activity.highlight ? 'highlight' : ''}`}>
                    <div className="activity-time">{activity.time}</div>
                    <div className="activity-details">
                      <h4 className="activity-name">{activity.name}</h4>
                      <p className="activity-location">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="location-icon">
                          <path d="M10 2 C6 2 3 5 3 9 C3 14 10 18 10 18 C10 18 17 14 17 9 C17 5 14 2 10 2 Z M10 11 C8.5 11 7 9.5 7 8 C7 6.5 8.5 5 10 5 C11.5 5 13 6.5 13 8 C13 9.5 11.5 11 10 11 Z" />
                        </svg>
                        {activity.location}
                      </p>
                      <p className="activity-description">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dress-code">
        <h3>Dress Code</h3>
        <p className="dress-title">Camp Casual Chic</p>
        <p className="dress-description">
          Think rustic elegance meets summer comfort. Flowy dresses, linen suits,
          and earth tones encouraged. Leave the stilettos at home - we'll be on grass!
        </p>
      </div>

      <div className="event-decorations">
        <Smores className="details-smores" />
      </div>
    </section>
  );
}
