# Camp Javery - Summer Camp Wedding Website

A whimsical, interactive wedding website for Avery & Jared's summer camp-themed wedding celebration at Camp Newaygo, Michigan (Labor Day Weekend 2026).

## Features

- **One-Page Design** - Smooth-scrolling single page with essential wedding information
- **Navigation Bar** - Easy navigation between sections
- **RSVP Form** - Guest registration with meal preferences and dietary restrictions
- **Contact Section** - Direct communication with the couple
- **Custom SVG Decorations** - Animated trees, campfires, lanterns, tents, and s'mores
- **Mobile Responsive** - Works beautifully on all device sizes

## Sections

- Hero
- Meet the Couple
- RSVP
- Contact Us
- Footer

## Tech Stack

**Frontend:**
- React 19.2
- Vite 7.2
- Vanilla CSS with CSS Variables

**Backend:**
- Node.js + Express
- Anthropic Claude API
- RAG (Retrieval-Augmented Generation) for chatbot context

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. Install dependencies:
   ```bash
   npm install
   npm run server:install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Update the Formspree form ID in `src/components/RSVP.jsx` with your own form ID.

### Running the Application

```bash
# Run both frontend and backend concurrently
npm run dev:all

# Or run separately:
npm run dev      # Frontend only (port 5173)
npm run server   # Backend only (port 3001)
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start backend server |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## License

Private project for personal use.

---

*Made with love for Camp Javery - Where Two Trails Become One*
# simple_summer_camp_wedding
