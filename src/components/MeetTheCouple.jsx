import { Lantern } from './decorations';

const profiles = [
  {
    name: 'Jared Michael Chapman',
    role: 'The Groom',
    description: 'A Chicago native with a passion for comedy and adventure. When he\'s not making people laugh, you\'ll find him planning the next great escape or perfecting his campfire cooking skills.',
    funFacts: [
      'Improv performer at iO Chicago',
      'Self-proclaimed s\'mores connoisseur',
      'Always has a terrible pun ready'
    ]
  },
  {
    name: 'Avery Leigh Wine',
    role: 'The Bride',
    description: 'A creative spirit who brings warmth and joy to every room. Her love for the outdoors and knack for storytelling made camping the perfect wedding theme.',
    funFacts: [
      'Fellow iO improv alum',
      'Master trip planner',
      'Can quote every line from her favorite movies'
    ]
  },
  {
    name: 'Dr. Pugsley Bikini',
    role: 'The Ring Bearer (& Best Pup)',
    description: 'A distinguished gentleman who joined the pack in May 2020. Despite his fancy title, he prefers belly rubs to board meetings and treats to transcripts.',
    funFacts: [
      'PhD in Snuggle Sciences',
      'Expert nap consultant',
      'Voted "Most Likely to Steal Your Seat"'
    ]
  }
];

export default function MeetTheCouple() {
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
          <div key={index} className={`profile-card ${profile.name === 'Dr. Pugsley Bikini' ? 'pup-card' : ''}`}>
            <div className="profile-image-placeholder">
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
            </div>

            <div className="profile-content">
              <span className="profile-role">{profile.role}</span>
              <h3 className="profile-name">{profile.name}</h3>
              <p className="profile-description">{profile.description}</p>

              <div className="fun-facts">
                <h4>Fun Facts:</h4>
                <ul>
                  {profile.funFacts.map((fact, factIndex) => (
                    <li key={factIndex}>{fact}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
