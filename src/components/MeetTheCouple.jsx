import { useState } from 'react';
import { Lantern } from './decorations';

const profiles = [
  {
    name: 'Jared Michael Chapman',
    role: 'The Groom',
    photo: '/photos/groom.JPEG'
  },
  {
    name: 'Avery Leigh Wine',
    role: 'The Bride',
    photo: '/photos/avery_zoomed.jpg'
  },
  {
    name: 'Dr. Pugsley Bikini',
    role: 'The Ring Bearer (& Best Pup)',
    photo: '/photos/the_ring_bearer.jpeg'
  }
];

export default function MeetTheCouple() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const handleProfileClick = (profileName) => {
    // Easter egg: clicking on Jared or Avery reveals their first DMs
    if (profileName === 'Jared Michael Chapman' || profileName === 'Avery Leigh Wine') {
      setShowEasterEgg(true);
    }
  };

  return (
    <section id="meet-us" className="meet-the-couple">
      <Lantern className="meet-lantern meet-lantern-left" />
      <Lantern className="meet-lantern meet-lantern-right" />

      <div className="section-header">
        <h2>Meet the Campers</h2>
        <p className="section-subtitle">Get to know the crew behind Camp Javery</p>
      </div>

      <div className="profiles-container">
        {profiles.map((profile, index) => (
          <div
            key={index}
            className={`profile-card ${profile.name === 'Dr. Pugsley Bikini' ? 'pup-card' : ''} ${(profile.name === 'Jared Michael Chapman' || profile.name === 'Avery Leigh Wine') ? 'clickable-profile' : ''}`}
            onClick={() => handleProfileClick(profile.name)}
          >
            <div className="profile-image-placeholder">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className={`profile-photo ${profile.role === 'The Bride' ? 'bride-photo' : ''}`} />
              ) : (
                <div className="profile-icon">
                  {profile.name === 'Dr. "Pugsley" Bikini' ? (
                    <svg viewBox="0 0 60 60" fill="currentColor">
                      <ellipse cx="30" cy="32" rx="18" ry="15" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="23" cy="29" r="3" fill="currentColor" />
                      <circle cx="37" cy="29" r="3" fill="currentColor" />
                      <ellipse cx="30" cy="36" rx="4" ry="3" fill="#D4845F" />
                      <path d="M10 28 Q6 16 16 20 Q20 22 17 28" fill="currentColor" />
                      <path d="M50 28 Q54 16 44 20 Q40 22 43 28" fill="currentColor" />
                      <path d="M24 39 Q30 44 36 39" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 60 60" fill="currentColor">
                      <circle cx="30" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M15 55 Q15 38 30 38 Q45 38 45 55" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            <div className="profile-content">
              <span className="profile-role">{profile.role}</span>
              <h3 className="profile-name">{profile.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Easter Egg Modal - First Instagram DMs */}
      {showEasterEgg && (
        <div className="easter-egg-overlay" onClick={() => setShowEasterEgg(false)}>
          <div className="easter-egg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="easter-egg-close" onClick={() => setShowEasterEgg(false)}>×</button>
            <h3 className="easter-egg-title">Where it all began...</h3>
            <p className="easter-egg-subtitle">Our first Instagram DMs - September 2017</p>
            <div className="easter-egg-image-container">
              <img
                src="/photos/Screenshot 2026-02-11 at 7.31.32 PM.png"
                alt="Jared and Avery's first Instagram DMs from September 2017"
                className="easter-egg-image"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
