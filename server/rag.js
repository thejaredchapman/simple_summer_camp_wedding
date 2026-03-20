/**
 * Simple RAG (Retrieval-Augmented Generation) Service
 * Contains all Camp Javery wedding information
 */

export class RAGService {
  constructor() {
    this.documents = [];
    this.index = new Map();
  }

  addDocument({ title, content, metadata = {} }) {
    const doc = {
      id: this.documents.length,
      title,
      content,
      metadata,
      tokens: this.tokenize(content + ' ' + title)
    };

    this.documents.push(doc);
    this.indexDocument(doc);
    return doc.id;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  indexDocument(doc) {
    const tokenCounts = new Map();

    for (const token of doc.tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }

    for (const [token, count] of tokenCounts) {
      if (!this.index.has(token)) {
        this.index.set(token, []);
      }
      this.index.get(token).push({
        docId: doc.id,
        frequency: count / doc.tokens.length
      });
    }
  }

  search(query, topK = 3) {
    const queryTokens = this.tokenize(query);
    const scores = new Map();

    for (const token of queryTokens) {
      const postings = this.index.get(token) || [];
      const idf = Math.log(1 + this.documents.length / (postings.length + 1));

      for (const posting of postings) {
        const currentScore = scores.get(posting.docId) || 0;
        scores.set(posting.docId, currentScore + posting.frequency * idf);
      }
    }

    const sortedDocs = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([docId]) => this.documents[docId]);

    return sortedDocs;
  }

  getAllDocuments() {
    return this.documents.map(({ id, title, metadata }) => ({
      id,
      title,
      metadata
    }));
  }

  getDocumentCount() {
    return this.documents.length;
  }

  loadDefaultDocuments() {
    const weddingDocs = [
      {
        title: 'Wedding Overview',
        content: `Camp Javery is the summer camp themed wedding of Jared Michael Chapman and Avery Leigh Wine.
        The wedding takes place Labor Day Weekend 2026, September 3-6, 2026.
        The venue is Camp Newaygo located at 5333 S Centerline Rd, Newaygo, MI 49337.
        Camp Newaygo has over 100 acres, located on a chain of inland lakes with incredible facilities.
        With over one mile of sunset view waterfront, a private island to paddle to, and a two-mile loop accessible nature boardwalk.`
      },
      {
        title: 'The Couple - Jared',
        content: `Jared Michael Chapman is the groom.
        He is a Chicago native with a passion for comedy and adventure.
        He is a comedy and improv enthusiast.
        He is a self-proclaimed s'mores connoisseur.
        He always has a terrible pun ready.
        When he's not making people laugh, you'll find him planning the next great escape or perfecting his campfire cooking skills.`
      },
      {
        title: 'The Couple - Avery',
        content: `Avery Leigh Wine is the bride.
        She is a remarkable force of creativity, intelligence, and warmth who lights up every space she enters.
        With her sharp wit, boundless energy, and genuine care for the people around her, Avery has a gift for turning ordinary moments into extraordinary memories.
        Her love for adventure and the outdoors, combined with her exceptional organizational skills and infectious enthusiasm, made a camp wedding the only choice.
        Fun facts: Master trip planner extraordinaire, brings the party wherever she goes, and historically hates movies (yes, really!).`
      },
      {
        title: 'The Ring Bearer - Pugsley',
        content: `Dr. Pugsley Bikini is the ring bearer and best pup.
        He is a distinguished gentleman who joined the pack in May 2020.
        Despite his fancy title, he prefers belly rubs to board meetings and treats to transcripts.
        Fun facts: PhD in Snuggle Sciences, expert nap consultant, voted "Most Likely to Steal Your Seat".`
      },
      {
        title: 'Camp Schedule',
        content: `Full schedule to be provided closer to the date!
        We hope you can join us for some or all of our wedding weekend fun!

        Thursday, September 3: Jared & Avery arrive to kick off the festivities. If you're staying at Camp Newaygo, pitch your tent, settle in, and warm up your vocal cords for karaoke and camp fires.

        Friday, September 4: A full day of classic summer camp fun - games, crafts, and plenty of time to relax and hang out.

        Saturday, September 6: We say "I do!". Wedding ceremony and reception celebrations at Camp Newaygo. Can't wait to celebrate with you!`
      },
      {
        title: 'Lodging at Camp Newaygo',
        content: `The bride and groom will be staying at Camp Newaygo and welcome you to join us.
        We realize camping isn't everyone's style - details on offsite accommodations available.

        Lodging at camp is rustic, fun, and all about the experience!

        Dormitories: Bunk with 10-20 of your closest friends in air conditioning and full electricity! $50 per person per night.

        Cabins: Get the full parent trap experience in cabins with lights but no outlets and a short walk to the lodge for bathrooms. 10 cabins that sleep up to 12 people available. $50 per person per night.

        Platform Tents: Looking for a quieter more rustic experience – canvas platform tents are available. They are a bit away from the main lodge but have water running to them and an outhouse near them. $50 per person per night.

        Bring Your Own Tent: If you wish to bring your own tent and gear - spaces are available for $25 per person per night with bathrooms and showers available.

        For all camping sleeping bags or bedding and pillows is required. Camp Newaygo has a limited number that can be rented.

        For immediate family a small select number of hotel style rooms are available at Camp Newaygo. Avery and Jared will reach out to confirm these rooms.`
      },
      {
        title: 'Offsite Accommodations',
        content: `Recommended offsite accommodations:

        Muskegon River Inn: Only 7 minutes from camp. A small inn with amazing showers and perfectly situated in downtown Newaygo. Standard rooms available for $145 and suites for $155. Avery & Jared have all 7 rooms blocked for the wedding. Call the hotel directly at 307-690-4960 to make a reservation (2 nights minimum required). A shuttle will run a few times the day of the wedding to and from this location.

        Airbnbs: Northern Michigan is full of amazing Airbnbs, many of which are very close to Camp Newaygo.`
      },
      {
        title: 'What to Bring for Camping',
        content: `What should I bring if I'm staying at camp?
        - Sleeping bag or bedding & pillow
        - Towels and toiletries
        - Flashlight
        - Comfortable clothes for camp activities
        - A jacket or layers for cooler evenings`
      },
      {
        title: 'Getting Ready and Bathrooms',
        content: `How will I get ready for a wedding while camping?
        Camp Newaygo has very nice modern bathrooms with excellent facilities for getting ready.`
      },
      {
        title: 'Dress Code',
        content: `What is the dress code?
        Wedding day attire is bold & bright!
        For the rest of the weekend, think casual camp clothes, sneakers and layers.`
      },
      {
        title: 'Outdoor Activities',
        content: `Will we be outside?
        Yes - many activities, including the ceremony, will be outdoors.
        Please plan for grass, gravel paths, and weather-appropriate footwear.`
      },
      {
        title: 'Kids Policy',
        content: `Are kids welcome?
        Unfortunately, this is an adults only summer camp with exceptions only being made for the bride and groom's nieces and nephew.`
      },
      {
        title: 'Partial Weekend Attendance',
        content: `Can I join just for part of the weekend?
        Absolutely! Join us for whatever days and activities you wish!`
      },
      {
        title: 'Plus Ones and Guests',
        content: `Can I bring a guest or plus-one?
        Due to space limitations, we're only able to accommodate the guests named on the invitation.
        We appreciate your understanding and can't wait to celebrate with everyone who's invited!`
      },
      {
        title: 'Contact Information',
        content: `For questions about the wedding:
        Email: javery.chapmanwine@gmail.com
        Text the bride and groom directly for urgent matters.`
      },
      {
        title: 'Venue Details - Camp Newaygo',
        content: `Camp Newaygo Overview:
        Over 100 acres, located on a chain of inland lakes, Camp Newaygo's facilities are incredible.
        With over one mile of sunset view waterfront, a private island to paddle to, and a two-mile loop accessible nature boardwalk – our natural resources are complemented by our indoor spaces.
        Website: campnewaygo.org
        Address: 5333 S Centerline Rd, Newaygo, MI 49337`
      }
    ];

    for (const doc of weddingDocs) {
      this.addDocument(doc);
    }
  }
}
