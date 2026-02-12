import { Lantern, Campfire } from './decorations';

const storyChapters = [
  {
    year: '2015',
    title: 'Two Newcomers in Chicago',
    content: `In 2015, two newcomers arrived in Chicago looking for a fresh start: Jared, bringing his southern charm from Atlanta, and Avery, hailing from Michigan. Their paths first crossed in the hallways of iO Theater, where they spent three years perfecting the art of "just being friends."`
  },
  {
    year: '2018',
    title: 'The LinkedIn Slide',
    content: `The "friend zone" officially ended when Jared took a bold, professional risk: sliding into Avery's LinkedIn DMs. It wasn't exactly the place for romance, but it worked. Avery countered with an invite to a comedy show featuring a then-unproblematic Dave Chappelle, and the rest was history. It wasn't long into their dating journey that Jared was the first to say "I love you," setting the stage for everything to come.`
  },
  {
    year: '2019-2020',
    title: 'Lockdown Love',
    content: `After a year of dating, Jared moved in during November 2019—just months before the world turned upside down. While 2020 was a challenge for many, for them, it was an accelerant. They squeezed years of relationship milestones into months of lockdown, featuring Avery as Jared's personal (and experimental) hairstylist and the arrival of their favorite roommate, Pugsley.`
  },
  {
    year: '2021-2024',
    title: 'Adventures Together',
    content: `From surviving their first cross-country road trip to helping Pugsley conquer his fear of bridges, they've navigated career shifts, new apartments, and thousands of miles together. Most recently, they've traded Chicago winters for the California sun, moving to Los Angeles to explore new adventures and see what the West Coast has to offer.`
  },
  {
    year: 'Today',
    title: 'Building a Beautiful Future',
    content: `Through every change in locale and career, they have built a life defined by growth and love. Whether they are hosting Sunday dinners for friends or on a quest for the best chicken wings in the U.S., their mission remains the same: building a beautiful future together and making sure Pugsley knows he's living a far better life than he ever had before.`
  }
];

export default function TheirStory() {
  return (
    <section id="our-story" className="their-story">
      <Lantern className="story-lantern story-lantern-left" />
      <Lantern className="story-lantern story-lantern-right" />

      <div className="section-header">
        <h2>Their Story</h2>
        <p className="section-subtitle">From improv partners to life partners</p>
      </div>

      <div className="story-container">
        {storyChapters.map((chapter, index) => (
          <div key={index} className={`story-chapter ${index % 2 === 0 ? 'chapter-left' : 'chapter-right'}`}>
            <div className="chapter-year">{chapter.year}</div>
            <div className="chapter-content">
              <h3 className="chapter-title">{chapter.title}</h3>
              <p className="chapter-text">{chapter.content}</p>
            </div>
          </div>
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
