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
    title: "Issue #1: Lone Star Origins (2017)",
    text: `Our story begins on a sweltering Texas night in 2017, beneath the vast star-filled sky of San Antonio. In the back room of "Big Earl's Premium Pup Palace & BBQ Joint," a legend drew his first wheezing breath. This was no ordinary dog—he was a glorious, genetic lottery of Beagle, Corgi, Hound, and Supermutt. With the long body of a Corgi, the floppy ears of a Beagle, and a howl that could rattle windows, Pugsley thrived in the brutal Texas heat. His early months were spent under the tutelage of Sensei Snausage, a wise Blue Heeler who ran an illegal martial arts dojo behind a Whataburger. "The head tilt, pardner," the Sensei would bark, "is a weapon of MASS PERSUASION."`
  },
  {
    title: "Issue #2 & 3: The Dark Years & The Incident",
    text: `By six months old, Pugsley had been adopted and returned seven times. He had ISSUES. His first owner was a cruel man who associated masculine energy and deep voices with pain. Tragically, when a kind Black neighbor tried to rescue Pugsley from a beating, the abuser yanked him away, screaming racist vitriol. In Pugsley's hurting mind, a twisted connection was made: he learned to fear the very people who wanted to save him. He bounced through foster homes until he landed with a traveling rodeo. It was there, outside the Houston Livestock Show, that Pugsley witnessed a terrifying gunfight. As muzzle flashes lit the night, Pugsley froze in his "SECURITY" vest. His world-view was shattered: Trust no one.`,
    image: "/pugsley_story/composite.jpg",
    imageAlt: "Pugsley witnessing chaos and providing therapy"
  },
  {
    title: "Issue #4 & 5: Healing and the Third Snort",
    text: `Pugsley eventually found Dr. Linda Ramirez, a trauma specialist who taught him that "hurt dogs can heal." But just as he began to find peace, the sky opened up. In 2019, a violet beam lifted Pugsley into a Zorbaxian spacecraft. The aliens were obsessed with his chaotic genetic sequence. During a "Reverse Sneeze Calibration Test," Pugsley sneezed so powerfully he created a temporal rift! To stabilize him, the aliens crossed his optical neurons with his dimensional perception. He woke up permanently cross-eyed, but gifted with the ability to see 0.3 seconds into the future and sense the TRUE hearts of humans.`,
    image: "/pugsley_story/abduction.jpg",
    imageAlt: "Pugsley being abducted by Zorbaxian aliens"
  },
  {
    title: "Issue #6 & 7: Destiny Calls (2020)",
    text: `Early 2020. The world was changing, and Pugsley was waiting. Enter Jared and Avery. Jared, a Black man with a gentle soul, saw Pugsley's profile and knew the truth: "Fear can be unlearned." When they first met, Pugsley's old programming screamed DANGER. But his new cosmic senses whispered HEALING. He saw Jared's heart—pure, patient, and kind. Taking a shaky step forward on his short Corgi legs, Pugsley performed the "Snausage Head Tilt." Welcome home, Dr. Pugsley Bikini.`
  },
  {
    title: "Issue #8: The 'Stockholm Syndrome' Arc (2020-2025)",
    text: `For years, Jared was relentless with his gentleness. He let Pugsley set the boundaries, celebrating every tiny breakthrough. Slowly, the trauma crumbled. Pugsley realized that Jared wasn't a threat; he was the safest person in the universe. Pugsley began seeking out Black people everywhere—from Mr. Johnson the neighbor to Jerome the mail carrier—replacing fear with a demand for belly rubs. Avery joked it was Stockholm Syndrome; Pugsley knew it was Trust.`
  },
  {
    title: "Issue #9-12: The Colombia Betrayal & The Reckoning",
    text: `In March 2025, the ultimate betrayal occurred: They went to Colombia without him. Pugsley spent the week giving the "silent treatment" to the FaceTime camera. When they returned, Jared dropped the bombshell: He had proposed to Avery in Cartagena. Pugsley unleashed a howl of profound disappointment. I overcame racism for you! I rewired my brain! And you propose without your primary therapist present?! Jared wept, realizing the depth of Pugsley's commitment. He promised Pugsley a front-row seat as the Best Man.`
  },
  {
    title: "Issue #13 & 14: The Great Western Migration",
    text: `In late 2025, the trio packed up for Los Angeles. Pugsley supervised the move from inside various boxes. The road trip was a revelation—Beagle nose out the window, crossing the desert into a land of dog-friendly patios and diverse communities. Now, in the City of Angels, Dr. Pugsley Bikini is a local legend. Whether he's eating peach cobbler with Ms. Lorraine in Crenshaw or providing trauma therapy to anxious poodles, he is a living testament to the power of love.`
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
            <p className="easter-egg-subtitle">Our first LinkedIn DMs - September 2017 #cringe</p>
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
              <p className="pugsley-story-subtitle">The Cosmic Canine Chronicle</p>
            </div>
            <div className="pugsley-story-content">
              <div className="pugsley-comic-image">
                <img
                  src="/pugsley_story/cover.jpg"
                  alt="Dr. Pugsley Bikini Comic Book Cover - Heart of Gold, Eyes of Chaos"
                />
              </div>
              <div className="pugsley-story-chapters">
                {pugsleyStory.map((chapter, index) => (
                  <div key={index} className="pugsley-chapter">
                    <h4 className="pugsley-chapter-title">{chapter.title}</h4>
                    <p className="pugsley-chapter-text">{chapter.text}</p>
                    {chapter.image && (
                      <div className="pugsley-chapter-image">
                        <img src={chapter.image} alt={chapter.imageAlt} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="pugsley-story-quote">
                <p>"Coming in 2026: The Wedding Special — How Dr. Bikini saved the ceremony and still managed to judge Jared for the Colombia thing."</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
