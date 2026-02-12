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

const pugsleyStory = [
  {
    title: "The Lonesome Wanderer",
    text: `The year was 2017. A cosmic anomaly (or perhaps just a very eccentric kennel) birthed a legend. He wasn't just a Pug; he was a force of nature, a pint-sized enigma named simply "Pug-X." For three years, Pug-X roamed the concrete jungles as a canine ronin, a dog with no name and a heart full of untapped potential. He survived on fallen hot dogs and the kindness of strangers, his spirit unbroken, his destiny unwritten.`
  },
  {
    title: "A New Home, A New Name (2020)",
    text: `Then came the fateful year of 2020. While the world stood still, grappling with unprecedented challenges, Pug-X's adventure hit warp speed. One rainy afternoon, sheltering under a newspaper stand, he encountered them: the Power Duo, Jared (The Architect of Adventure) and Avery (The Keeper of the Kibble). They weren't just looking for a pet; they were looking for a soulmate. And Pug-X, with a single, perfectly timed sneeze, sealed his fate. He was christened "Pugsley," and with a new name came a new purpose.`
  },
  {
    title: "The Cosmic Cross-Eyed Curse!",
    text: `But peace was short-lived! One starry night, while investigating a suspicious glowing firefly, Pugsley was abruptly hoisted into the sky by a Zeta Reticulan tractor beam. These were the notorious "Optical Obsessors," extraterrestrial optometrists on a mission to understand Earth's most complex visual phenomena. In their misguided attempt to "optimize" his ocular capabilities, they tried to download the entire library of the known universe into his canine brain. The result? A permanent, heroically cross-eyed gaze and Parallel Vision: one eye seeing the mundane present, the other glimpsing chaotic flashes of potential futures!`
  },
  {
    title: "The Doctor is IN",
    text: `Pugsley didn't let a little abduction slow him down. He embraced his expanded consciousness, earning a Doctorate in Love and a license in Canine Psychotherapy. His first major case? The infamous Gunfight at the OK Hydrant—a tense standoff between rival squirrel gangs and a particularly territorial mailman. With therapeutic barks and strategic tail-wags, Dr. Bikini calmed the situation before it devolved into total anarchy. He realized then that the world needed more than bark—it needed heart.`
  },
  {
    title: "The Legend Today",
    text: `Whether he's jet-setting across time zones, mediating disputes between toddlers and their toys, or prescribing "Three Belly Rubs and a Snack" to a weary soul, Dr. "Pugsley" Bikini remains the world's premier cross-eyed crusader. He's seen the stars, he's seen the streets, and now, he's seeing you... and the wall behind you... and perhaps a glimpse of what you'll have for dinner. All at the same time.`
  }
];

export default function MeetTheCouple() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showPugsleyStory, setShowPugsleyStory] = useState(false);

  const handleProfileClick = (profileName) => {
    if (profileName === 'Jared Michael Chapman' || profileName === 'Avery Leigh Wine') {
      setShowEasterEgg(true);
    } else if (profileName === 'Dr. Pugsley Bikini') {
      setShowPugsleyStory(true);
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
            className={`profile-card ${profile.name === 'Dr. Pugsley Bikini' ? 'pup-card' : ''} clickable-profile`}
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
            <p className="easter-egg-subtitle">Our first LinkedIn DMs - September 2017</p>
            <div className="easter-egg-image-container">
              <img
                src="/photos/first-dms.jpg"
                alt="Jared and Avery's first Instagram DMs from September 2017"
                className="easter-egg-image"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pugsley Story Modal */}
      {showPugsleyStory && (
        <div className="easter-egg-overlay" onClick={() => setShowPugsleyStory(false)}>
          <div className="pugsley-story-modal" onClick={(e) => e.stopPropagation()}>
            <button className="easter-egg-close" onClick={() => setShowPugsleyStory(false)}>×</button>
            <div className="pugsley-story-header">
              <h3 className="pugsley-story-title">Dr. "Pugsley" Bikini</h3>
              <p className="pugsley-story-subtitle">The Ballad of the Cross-Eyed Cupid</p>
            </div>
            <div className="pugsley-story-content">
              <div className="pugsley-comic-image">
                <img
                  src="/pugsley_story/pugsleycomicbook.jpg"
                  alt="Dr. Pugsley Bikini Comic Book Cover"
                />
              </div>
              <div className="pugsley-story-chapters">
                {pugsleyStory.map((chapter, index) => (
                  <div key={index} className="pugsley-chapter">
                    <h4 className="pugsley-chapter-title">{chapter.title}</h4>
                    <p className="pugsley-chapter-text">{chapter.text}</p>
                  </div>
                ))}
              </div>
              <div className="pugsley-story-quote">
                <p>"In a world of chaos and conflicting visions, the only true compass is the heart of a Pug."</p>
                <span>— Dr. Bikini's unpublished memoir, 'The Snort of Salvation'</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
