# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Camp Javery is a single-page wedding website for Jared & Avery's summer camp-themed wedding at Camp Newaygo, Michigan (Labor Day Weekend 2026). It has two independent parts: a Vite/React frontend and a Node.js/Express backend for the AI chatbot.

## Commands

### Frontend (root directory)
```bash
npm run dev        # Start Vite dev server on port 5173
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (server/ directory)
```bash
cd server && npm install   # First-time setup
npm run server             # Start backend with --watch on port 3001
```

### Run both together
```bash
npm run dev:all   # Runs frontend + backend concurrently
```

## Architecture

**Frontend** (`src/`) — React 19 + Vite, using `react-router-dom` with routes at `/` (HomePage), `/upload`, `/gallery`, `/slideshow`, and `/admin` (defined in `App.jsx`). The homepage is still the original single-page layout: all sections are components rendered sequentially. No state management library; components are mostly presentational. CSS lives in `src/index.css` using CSS variables. `src/pages/` holds route-level page components; `src/lib/` holds the shared photo API client (`photosApi.js`) and an image compression helper (`compressImage.js`) — both new conventions alongside the existing `src/components/` convention.

**Backend** (`server/`) — Separate Node.js package with its own `package.json` and `.env`. Express server exposing `/api/chat`, `/api/health`, dev-only `/api/documents`, and guest photo endpoints: `POST /api/photos/upload`, `GET /api/photos`, and password-protected `GET /api/admin/photos` / `DELETE /api/admin/photos`. Photos are stored in Vercel Blob storage (`server/photoStorage.js`) — there's no database; metadata (guest name, timestamp) is encoded directly in blob pathnames.

**Chatbot flow**: `src/components/Chatbot.jsx` → POST `/api/chat` → `server/index.js` retrieves relevant docs via `RAGService.search()` → injects as context into Claude API system prompt → returns response.

**RAG** (`server/rag.js`) — Simple TF-IDF keyword search (no embeddings). All wedding knowledge is hardcoded in `loadDefaultDocuments()`. To update wedding info, edit documents there and restart the server.

**Decorations** (`src/components/decorations/`) — Pure SVG components (trees, campfire, lanterns, etc.) used for visual flair throughout the page.

**Image optimization** (`src/components/utils/`) — `OptimizedImage.jsx` and `LazyImage.jsx` serve WebP variants from `public/photos/optimized/`.

**Standalone scripts** (`scripts/`) — `generate-qr.js` (prints a QR code image for the `/upload` page) and `sync-to-google-photos.js` (archives guest photos into a Google Photos album). Both are run manually and are not part of the running app.

## Environment Setup

Frontend env vars use the `VITE_` prefix (Vite convention). Backend vars go in `server/.env` (not the root `.env`).

Copy `.env.example` to `server/.env` and fill in:
- `ANTHROPIC_API_KEY` — required for chatbot
- `VITE_GOOGLE_MAPS_API_KEY` — used in the Getting There section (set in root `.env` for Vite)
- `ALLOWED_ORIGINS` — update for production deployments

## Key Details

- The chatbot uses `claude-haiku-4-5-20250514` (defined in `server/index.js:289`)
- Rate limiting: 20 requests/minute per IP (in-memory, resets on restart)
- `/api/documents` POST/GET endpoints are disabled in production (`NODE_ENV=production`)
- `src/components/index.js` is the barrel export for all section components
