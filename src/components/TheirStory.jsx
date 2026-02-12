import { Lantern, Campfire } from './decorations';

const storyParagraphs = [
  `In 2015, two newcomers arrived in Chicago looking for a fresh start: Jared, bringing his southern charm from Atlanta, and Avery, hailing from Michigan. Their paths first crossed in the hallways of iO Theater, where they spent three years perfecting the art of "just being friends."`,

  `The "friend zone" officially ended when Jared took a bold, professional risk: sliding into Avery's LinkedIn DMs. It wasn't exactly the place for romance, but it worked. Avery countered with an invite to a comedy show featuring a then-unproblematic Dave Chappelle, and the rest was history. It wasn't long into their dating journey that Jared was the first to say "I love you," setting the stage for everything to come.`,

  `After a year of dating, Jared moved in during November 2019—just months before the world turned upside down. While 2020 was a challenge for many, for them, it was an accelerant. They squeezed years of relationship milestones into months of lockdown, featuring Avery as Jared's personal (and experimental) hairstylist and the arrival of their favorite roommate, Pugsley.`,

  `From surviving their first cross-country road trip to helping Pugsley conquer his fear of bridges, they've navigated career shifts, new apartments, and thousands of miles together. Along the way, their family has grown in the best ways: Auntie Avery gained a niece, and Uncle Jared gained three nieces and a nephew.`,

  `Most recently, they've traded Chicago winters for the California sun, moving to Los Angeles to explore new adventures and see what the West Coast has to offer. Through every change in locale and career, they have built a life defined by growth and love. Whether they are hosting Sunday dinners for friends or on a quest for the best chicken wings in the U.S., their mission remains the same: building a beautiful future together and making sure Pugsley knows he's living a far better life than he ever had before.`
];

export default function TheirStory() {
  return (
    <section id="our-story" className="their-story">
      <Lantern className="story-lantern story-lantern-left" />
      <Lantern className="story-lantern story-lantern-right" />

      <div className="section-header">
        <h2>The Long Game</h2>
        <p className="section-subtitle">From improv partners to life partners</p>
      </div>

      <div className="story-container story-paragraphs">
        {storyParagraphs.map((paragraph, index) => (
          <p key={index} className="story-paragraph">{paragraph}</p>
        ))}
      </div>

      <div className="story-closing">
        <Campfire className="story-campfire" />
        <p className="closing-message">
          We appreciate you all so much and love that you can be a part of this union as we start our next chapter!
        </p>
      </div>
    </section>
  );
}
