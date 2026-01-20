/**
 * Simple RAG (Retrieval-Augmented Generation) Service
 *
 * This is a lightweight in-memory implementation using TF-IDF-like scoring.
 * For production, consider using:
 * - Vector databases: Pinecone, Chroma, Weaviate
 * - Embedding models: OpenAI embeddings, Cohere, local models
 * - LangChain or LlamaIndex for more sophisticated RAG pipelines
 */

export class RAGService {
  constructor() {
    this.documents = [];
    this.index = new Map(); // Simple inverted index for keyword search
  }

  /**
   * Add a document to the knowledge base
   */
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

  /**
   * Simple tokenization
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Build inverted index for the document
   */
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

  /**
   * Search for relevant documents
   */
  search(query, topK = 3) {
    const queryTokens = this.tokenize(query);
    const scores = new Map();

    // Calculate relevance scores using TF-IDF-like scoring
    for (const token of queryTokens) {
      const postings = this.index.get(token) || [];
      const idf = Math.log(1 + this.documents.length / (postings.length + 1));

      for (const posting of postings) {
        const currentScore = scores.get(posting.docId) || 0;
        scores.set(posting.docId, currentScore + posting.frequency * idf);
      }
    }

    // Sort by score and return top K documents
    const sortedDocs = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([docId]) => this.documents[docId]);

    return sortedDocs;
  }

  /**
   * Get all documents
   */
  getAllDocuments() {
    return this.documents.map(({ id, title, metadata }) => ({
      id,
      title,
      metadata
    }));
  }

  /**
   * Get document count
   */
  getDocumentCount() {
    return this.documents.length;
  }

  /**
   * Load default wedding documents
   * Customize these with your actual wedding details!
   */
  loadDefaultDocuments() {
    const weddingDocs = [
      {
        title: 'Venue Information',
        content: `The wedding will be held at a beautiful summer camp venue.
        The ceremony will take place outdoors by the lake, weather permitting.
        The reception will be in the main lodge building.
        Address and specific directions will be provided in the formal invitation.
        The venue has rustic charm with modern amenities.`
      },
      {
        title: 'Schedule and Timeline',
        content: `Wedding Day Schedule:
        - Guest arrival: 3:00 PM
        - Ceremony begins: 4:00 PM
        - Cocktail hour: 5:00 PM
        - Dinner service: 6:00 PM
        - Dancing and celebration: 7:30 PM - 11:00 PM
        - Late night snacks: 10:00 PM
        Please arrive on time as the ceremony will start promptly.`
      },
      {
        title: 'Dress Code',
        content: `The dress code is "Summer Camp Chic" - think elevated casual!
        For guests: Sundresses, khakis, nice shorts are all welcome.
        Comfortable shoes recommended as there will be grass and outdoor areas.
        Layers suggested as evenings can be cool.
        Feel free to embrace the camp theme with flannel or outdoor-inspired attire.
        Please avoid white or cream colors (reserved for the bride).`
      },
      {
        title: 'Accommodations',
        content: `Several accommodation options are available:
        - On-site cabins: Limited availability, first-come first-served
        - Nearby hotels: A room block has been reserved at local hotels
        - Camping: For adventurous guests, camping is available on the grounds
        Details and booking links will be on the wedding website.
        We recommend booking early as summer is a busy season.`
      },
      {
        title: 'Food and Drinks',
        content: `Dinner will be a BBQ-style feast with:
        - Grilled meats and vegetarian options
        - Fresh salads and seasonal sides
        - Classic camp desserts including s'mores bar
        Full bar service with beer, wine, and signature cocktails.
        Please let us know about any dietary restrictions or allergies.
        Kids menu available.`
      },
      {
        title: 'Activities and Entertainment',
        content: `Camp activities available throughout the celebration:
        - Lawn games: cornhole, horseshoes, giant Jenga
        - Photo booth with camp-themed props
        - Bonfire and s'mores after dark
        - Dancing under string lights
        - Camp crafts station
        Something fun for all ages!`
      },
      {
        title: 'RSVP and Registry',
        content: `Please RSVP by the date on your invitation.
        RSVP online through our wedding website or mail back the response card.
        Our registry information is available on the wedding website.
        Your presence is the greatest gift, but if you'd like to give something,
        we're registered at a few places and also have a honeymoon fund.`
      },
      {
        title: 'Getting There and Parking',
        content: `The venue is located approximately [X] miles from downtown.
        Free parking is available on-site in the main lot.
        Shuttle service may be available from partner hotels - check the website.
        Rideshare services operate in the area.
        Carpooling is encouraged!
        GPS coordinates and detailed directions on the wedding website.`
      },
      {
        title: 'Weather and What to Bring',
        content: `Summer weather can be warm during the day and cool at night.
        Bring sunscreen for the outdoor ceremony.
        Bug spray will be provided but feel free to bring your own.
        A light jacket or sweater for the evening is recommended.
        Comfortable walking shoes are a must for the camp terrain.
        Ceremony will move indoors in case of rain.`
      },
      {
        title: 'Contact Information',
        content: `For questions about the wedding, please contact:
        - General questions: [email address]
        - RSVP issues: [email address]
        - Accommodation help: [phone number]
        Check the FAQ on our wedding website first - many common questions are answered there!
        We're happy to help with any questions.`
      }
    ];

    for (const doc of weddingDocs) {
      this.addDocument(doc);
    }
  }
}
