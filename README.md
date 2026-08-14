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

## Guest Photo Upload Feature

Guests scan a QR code, upload photos from their phones (no account needed), and see
them in a live gallery (`/gallery`) and full-screen slideshow (`/slideshow`). You
moderate uploads from a password-protected `/admin` page.

Every guest-facing upload/gallery page (`/upload`, `/upload-video`,
`/gallery`, `/videos`) and the `/admin` page has a small "Contact Help"
link that opens a pre-filled email to `javery.chapmanwine@gmail.com` if
something goes wrong.

### Local Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd simple_summer_camp_wedding
   npm install
   cd server && npm install && cd ..
   ```

2. **Create a Vercel Blob store:**
   - In the [Vercel dashboard](https://vercel.com/dashboard), open the
     `simple-summer-camp-wedding` project → **Storage** → **Create Database** → **Blob**.
   - Open the new store's **.env.local** tab and copy the `BLOB_READ_WRITE_TOKEN` value.

3. **Set up environment variables:**
   - Copy `.env.example` to `server/.env`:
     ```bash
     cp .env.example server/.env
     ```
   - Fill in `server/.env` with:
     - `ANTHROPIC_API_KEY` (existing, required for the chatbot)
     - `BLOB_READ_WRITE_TOKEN` (from step 2)
     - `ADMIN_PASSWORD` (choose any password — this protects `/admin`)
   - In the repo root, create a `.env` file (Vite reads this automatically) with:
     ```
     VITE_BACKEND_URL=http://localhost:3001
     VITE_GOOGLE_MAPS_API_KEY=your_key_if_you_have_one
     ```

4. **Run everything locally:**
   ```bash
   npm run dev:all
   ```
   This starts the frontend at `http://localhost:5173` and the backend at
   `http://localhost:3001`.

5. **Test uploading from your actual phone (not just your laptop browser):**
   - Your phone needs to reach your computer's backend and frontend, which
     `localhost` won't do from another device. Two options:
     - **Same wifi network:** find your computer's LAN IP (macOS: `ipconfig getifaddr en0`),
       then visit `http://<your-LAN-IP>:5173/upload` on your phone, and set
       `VITE_BACKEND_URL=http://<your-LAN-IP>:3001` in your root `.env` before
       starting `npm run dev:all` (frontend env vars are baked in at build/start time).
     - **Any network (e.g. testing on cellular):** use a tunnel like
       [ngrok](https://ngrok.com/): `ngrok http 3001` for the backend and
       `ngrok http 5173` for the frontend, then set `VITE_BACKEND_URL` to the
       backend's ngrok URL.

### Production Deployment

Before deploying this branch, configure the following on your actual hosts —
missing any of these will break the photo feature, and one of them will take
down the existing chatbot too.

- **Vercel (frontend) project environment variable:**
  - `VITE_BACKEND_URL` — must point at your deployed backend's real URL (e.g.
    `https://your-backend.onrender.com`). If unset, the built frontend bundle
    falls back to `http://localhost:3001`, so every photo-related call will
    fail in production — and will likely be blocked outright as mixed content
    since the site is served over https.

- **Backend host (Render/Railway/wherever) environment variables:**
  - `ALLOWED_ORIGINS` — must include your production Vercel domain (e.g.
    `https://your-site.vercel.app`), or the browser's CORS preflight will fail
    on all four photo endpoints (`/api/photos/upload`, `/api/photos`,
    `/api/admin/photos` GET and DELETE).
  - `BLOB_READ_WRITE_TOKEN` and `ADMIN_PASSWORD` — both are **required** for
    the server to start at all. `server/index.js`'s `validateEnvironment()`
    calls `process.exit(1)` if either is missing.

  **Deploy-ordering trap:** because `validateEnvironment()` now requires
  `BLOB_READ_WRITE_TOKEN` and `ADMIN_PASSWORD` in addition to
  `ANTHROPIC_API_KEY`, the entire backend — including the previously-working
  chatbot — will refuse to boot after this deploy until both new variables are
  set. **Set `BLOB_READ_WRITE_TOKEN` and `ADMIN_PASSWORD` on the backend host
  before deploying this code**, not after, or you'll take down the chatbot
  along with the photo feature.

- **Vercel rewrites:** the repo root includes a `vercel.json` with a catch-all
  rewrite to `index.html`. This is required for client-side routing — without
  it, a direct visit to `/upload`, `/gallery`, `/slideshow`, or `/admin` (e.g.
  scanning the printed QR code) 404s instead of loading the app.

### QR Code for Guests

Once deployed, generate a printable QR code pointing at your live `/upload` page:
```bash
node scripts/generate-qr.js https://your-deployed-domain.com/upload
```
This saves `scripts/output/upload-qr.png` — print it for signage at the venue.

### Guest Video Uploads

Guests can also share short videos at `/upload-video` (a separate link from
`/upload` — print or share both QR codes if you want guests to have easy
access to each). Videos:

- Are capped at 250MB per upload (roughly a few minutes of phone video) —
  there's no way to compress video in the browser the way photos are
  compressed, so guests with longer clips will need to trim them first.
- Accept common phone formats: `.mp4` and `.mov` (iPhone), `.webm`.
- Appear in a dedicated gallery at `/videos` — **not** in `/slideshow`,
  which stays photos-only by design.
- Are moderated from the same `/admin` page as photos, in a separate
  "Video Moderation" section below the photo grid.

Generate a QR code for the video upload link the same way as the photo one:
```bash
node scripts/generate-qr.js https://your-deployed-domain.com/upload-video
```

### Post-Wedding Google Photos Archive

After the wedding, archive every guest photo into a Google Photos album in one
step. This requires a one-time Google Cloud setup — see the detailed walkthrough
in `scripts/sync-to-google-photos.js`'s Task 11 setup steps, or briefly:

1. Create OAuth credentials (Desktop app type) in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   with the Google Photos Library API enabled.
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `server/.env`.
3. Run:
   ```bash
   node scripts/sync-to-google-photos.js
   ```
4. Open the printed URL, sign in with the Google account you want the album
   created in, and approve access. The script creates a "Camp Javery Wedding"
   album and uploads every guest photo and video into it.

This script is never run automatically — it's meant to be run once, manually,
whenever you're ready to archive.

## License

Private project for personal use.

---

*Made with love for Camp Javery - Where Two Trails Become One*
