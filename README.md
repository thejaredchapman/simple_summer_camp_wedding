# Camp Javery - Summer Camp Wedding Website

A whimsical, interactive wedding website for Avery & Jared's summer camp-themed wedding celebration at Camp Newaygo, Michigan (Labor Day Weekend 2026).

## Features

- **One-Page Design** - Smooth-scrolling single page with essential wedding information
- **Navigation Bar** - Easy navigation between sections
- **AI Wedding Assistant** - Claude-powered chatbot to help guests with questions
- **Photo Gallery** - Memories from the couple's journey together
- **Contact Section** - Direct communication with the couple
- **Custom SVG Decorations** - Animated trees, campfires, lanterns, tents, and s'mores
- **Mobile Responsive** - Works beautifully on all device sizes

## Sections

- Hero
- Meet the Campers (Jared, Avery, and Pugsley)
- Photo Gallery
- Camp Schedule
- Lodging Information
- FAQs
- Contact Us

## Tech Stack

**Frontend:**
- React 19.2
- Vite 7.2
- Vanilla CSS with CSS Variables

**Backend:**
- Node.js + Express
- Anthropic Claude API (Claude 4.5 Haiku)
- RAG (Retrieval-Augmented Generation) for chatbot context

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Set up environment variables:

   Create a `.env` file in the `server/` directory:
   ```bash
   touch server/.env
   ```

   Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

### Running the Application

```bash
# Run both frontend and backend concurrently
npm run dev:all

# Or run separately in two terminals:

# Terminal 1 - Frontend (port 5173)
npm run dev

# Terminal 2 - Backend (port 3001)
cd server && node index.js
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## AI Wedding Assistant (Chatbot)

The website includes an AI-powered wedding assistant that helps guests with questions about the wedding.

### Features

- **Powered by Claude 4.5 Haiku** - Fast, intelligent responses
- **RAG-enabled** - Uses wedding-specific knowledge base for accurate answers
- **Auto-prompt** - Automatically opens after 10 seconds to offer help
- **Topics covered:**
  - Wedding schedule (Thursday-Saturday)
  - Lodging options (dorms, cabins, tents, offsite hotels)
  - What to bring for camping
  - Dress code (bold & bright!)
  - Kids policy
  - Plus-one policy
  - Venue information (Camp Newaygo)
  - Contact information

### Chatbot Setup

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)

2. Add the key to `server/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```

3. Start the backend server:
   ```bash
   cd server && node index.js
   ```

4. The chatbot will appear as a green button in the bottom-right corner of the website.

### Customizing the Knowledge Base

The chatbot's knowledge is stored in `server/rag.js`. To update wedding information:

1. Open `server/rag.js`
2. Edit the `loadDefaultDocuments()` function
3. Add, modify, or remove documents as needed
4. Restart the server

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and document count |
| `/api/chat` | POST | Send a message to the chatbot |
| `/api/documents` | GET | List all knowledge base documents (dev only) |
| `/api/documents` | POST | Add a document to knowledge base (dev only) |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start backend server |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
summer-camp-wedding-simple/
├── public/
│   ├── photos/           # Wedding photos
│   └── camp-sign.png     # Logo
├── server/
│   ├── index.js          # Express server & API routes
│   ├── rag.js            # Knowledge base for chatbot
│   └── .env              # API keys (not committed)
├── src/
│   ├── components/
│   │   ├── Chatbot.jsx   # AI assistant component
│   │   ├── Hero.jsx
│   │   ├── MeetTheCouple.jsx
│   │   ├── PhotoGallery.jsx
│   │   ├── Schedule.jsx
│   │   ├── Lodging.jsx
│   │   ├── FAQs.jsx
│   │   ├── ContactUs.jsx
│   │   └── ...
│   ├── App.jsx
│   └── index.css
└── README.md
```

## License

Private project for personal use.

---

*Made with love for Camp Javery - Where Two Trails Become One*
