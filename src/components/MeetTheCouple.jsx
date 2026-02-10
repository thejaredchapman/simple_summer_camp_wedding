import { Lantern } from './decorations';
import { useState } from 'react';

const profiles = [
  {
    name: 'Jared Michael Chapman',
    role: 'The Groom',
    description: 'A Chicago native with a passion for comedy and adventure. When he\'s not making people laugh, you\'ll find him planning the next great escape or perfecting his campfire cooking skills.',
    funFacts: [
      'Comedy and improv enthusiast',
      'Self-proclaimed s\'mores connoisseur',
      'Always has a terrible pun ready'
    ],
    photo: '/photos/groom.JPEG'
  },
  {
    name: 'Avery Leigh Wine',
    role: 'The Bride',
    description: 'A remarkable force of creativity, intelligence, and warmth who lights up every space she enters. With her sharp wit, boundless energy, and genuine care for the people around her, Avery has a gift for turning ordinary moments into extraordinary memories. Her love for adventure and the outdoors, combined with her exceptional organizational skills and infectious enthusiasm, made a camp wedding the only choice.',
    funFacts: [
      'Master trip planner extraordinaire',
      'Brings the party wherever she goes',
      'Historically hates movies (yes, really!)'
    ],
    photo: '/photos/avery_zoomed.jpg'
  },
  {
    name: 'Dr. Pugsley Bikini',
    role: 'The Ring Bearer (& Best Pup)',
    description: 'A distinguished gentleman who joined the pack in May 2020. Despite his fancy title, he prefers belly rubs to board meetings and treats to transcripts.',
    fullStory: `In the fall of 2022, life took another unexpected turn for Dr. Pugsley Bikini. Jared received a job opportunity too good to pass up—a position at a major tech company in Los Angeles. After much discussion, tears, and careful consideration, Avery and Jared decided to make the move to the West Coast. Pugsley, ever the adaptable traveler, seemed unfazed by the news. In fact, when they showed him pictures of palm trees and beaches, his tail wagged with what could only be interpreted as approval. Perhaps the Hawaiian shirts had been prophetic all along.

The cross-country move was an adventure in itself. Pugsley insisted on riding in the cabin during the flight, his carrier strategically positioned so he could watch the clouds drift by. When the plane descended into LAX and the California sunshine flooded through the windows, Pugsley let out a snort that the flight attendant swore sounded like a sigh of contentment.

Avery and Jared settled into a charming bungalow in Silver Lake, a neighborhood that perfectly suited their sensibilities—diverse, artistic, and dog-friendly. But more importantly, it suited Pugsley's newly discovered passion: the art of neighborhood reconnaissance and canine social networking.

Los Angeles transformed Dr. Pugsley Bikini in ways no one could have anticipated. While Chicago had taught him about community building and Chicago winters had tested his fashion convictions, Los Angeles awakened something primal and joyful within him—an unquenchable desire to sniff every square inch of his new territory and meet every single dog (and their humans) within a five-mile radius.

Pugsley's daily routine became the stuff of local legend. Each morning, he would stand by the door at precisely 7:00 AM, Hawaiian shirt already on (he'd learned to dress himself, somehow), ready to begin what Jared affectionately called "The Grand Sniffing Tour." The neighborhood became Pugsley's kingdom, and he approached his domain with the dedication of a scholar and the enthusiasm of a gossip columnist.

His first order of business was always the corner of Sunset Boulevard and Griffith Park Boulevard, where a diverse cast of canine characters gathered each morning. There was Duchess, a statuesque Afghan Hound whose owner, Marcus, was a longtime Black resident and retired music producer. Pugsley and Duchess formed an immediate bond, despite their vastly different appearances—or perhaps because of them. Marcus would laugh watching the dignified Duchess lower herself to sniff noses with the potato-shaped philosopher in a Hawaiian shirt.

Then there was Rocket, a hyperactive Jack Russell Terrier belonging to Maria, a Latina artist who had lived in Silver Lake for decades. Rocket and Pugsley became unlikely best friends, with Pugsley serving as the calm yin to Rocket's chaotic yang. They would trot alongside each other, Pugsley's methodical sniffing pace somehow syncing perfectly with Rocket's frenetic energy.

The Lady Squad, as Pugsley affectionately thought of them, consisted of three French Bulldogs named Coco, Chanel, and Dior, who belonged to a fabulous trio of friends who ran a local vintage clothing store. These ladies took one look at Pugsley's Hawaiian shirt collection and immediately adopted him as their fashion icon. They even started a Instagram account called "Pugs and Frenchies of Silver Lake" that gained a modest but devoted following.

But Pugsley's favorite hangout spot quickly became the Silver Lake Dog Park, a sprawling space where the true magic happened. Here, Dr. Pugsley Bikini's unique talents flourished in ways that even his Chicago days hadn't prepared him for. The Los Angeles dog park scene was a microcosm of the city itself—beautifully diverse, sometimes chaotic, often dramatic, but ultimately united by the love of their four-legged companions.

Pugsley developed what Avery called his "sniff and diplomacy" technique. He would arrive at the park, survey the scene with his wise (or nearsighted) eyes, and then systematically make his rounds. But he wasn't just sniffing for the sake of sniffing—he was gathering intelligence, assessing moods, and identifying which dogs (and humans) needed his particular brand of intervention.

One memorable afternoon, a tense standoff was brewing between two groups of owners whose dogs had gotten into a scuffle. Pugsley, sensing the escalating tension, waddled directly into the middle of the argument, sat down, and began to howl—not bark, but howl—in that melodic way he'd learned from his carnival days. The absurdity of the moment stopped everyone in their tracks. Both dogs came to investigate the strange sound, tails wagging, and suddenly the humans found themselves laughing instead of arguing.

Pugsley's reputation as the neighborhood's unofficial canine ambassador grew rapidly. He seemed to have a particular gift for introducing dogs who might not otherwise interact. The sight of Dr. Pugsley Bikini facilitating a meet-and-greet between a massive Great Dane named Apollo and a tiny Chihuahua named Peanut became a regular occurrence, with Pugsley serving as the confident middle-man, snorting encouragement to both parties.

But beyond the canine connections, Pugsley was doing what he'd always done best—bringing people together. His daily sniffing expeditions became opportunities for Avery and Jared to build community in their new city. Through Pugsley, they met their neighbors: the elderly Korean couple who ran the local convenience store and always kept treats for Pugsley; the young Black filmmaker who was working on a documentary about gentrification and ended up interviewing Avery and Jared about community building; the transgender activist who found comfort in Pugsley's nonjudgmental presence during difficult days.

Pugsley's work as a Doctor of Love continued and evolved in Los Angeles. Avery began bringing him to her new therapy practice, where he specialized in helping clients feel comfortable enough to open up. His presence in the waiting room became so popular that clients would sometimes arrive early just to spend time with him.

Jared started a blog called "Pugsley's LA Adventures" documenting their neighborhood walks, which inadvertently became a guide to the diverse, often overlooked corners of Silver Lake and surrounding neighborhoods. Through Pugsley's eyes (and nose), readers discovered the rich tapestry of cultures, stories, and connections that made Los Angeles so special.

Every evening, after his extensive sniffing expeditions and social calls, Dr. Pugsley Bikini would return home exhausted but fulfilled. He'd sprawl on his favorite spot on the couch, Hawaiian shirt askew, ukulele nearby (he'd started playing it again, inspired by the street musicians of Venice Beach), and reflect on the day's adventures. From Texas carnival grounds to Chicago winters to California sunshine, Pugsley had traveled far—not just in miles, but in purpose and impact.

He had learned that love transcends boundaries, that community is built one sniff and one conversation at a time, and that sometimes the best diplomats come in the most unlikely packages. Whether he was facilitating difficult conversations about race and justice, mediating disputes between feuding dog owners, or simply bringing joy to everyone he met on his daily sniffing tours, Dr. Pugsley Bikini remained true to his calling.

And as the California sun set over Silver Lake each evening, painting the sky in shades of orange and pink that perfectly matched his favorite Hawaiian shirt, Pugsley knew he was exactly where he was meant to be—surrounded by love, spreading joy, and always, always ready to sniff out new adventures and make new friends, both canine and human.`,
    funFacts: [
      'PhD in Snuggle Sciences',
      'Expert nap consultant',
      'Voted "Most Likely to Steal Your Seat"'
    ],
    photo: '/photos/the_ring_bearer.jpeg'
  }
];

export default function MeetTheCouple() {
  const [expandedStory, setExpandedStory] = useState(false);

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
              <p className="profile-description">{profile.description}</p>

              {profile.fullStory && (
                <>
                  {expandedStory && (
                    <div className="full-story">
                      {profile.fullStory.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                  <button
                    className="read-more-btn"
                    onClick={() => setExpandedStory(!expandedStory)}
                  >
                    {expandedStory ? 'Show less' : 'Continue reading...'}
                  </button>
                </>
              )}

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
