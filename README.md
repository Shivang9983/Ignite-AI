# AI Chat

A simple chat website built with React and Google Gemini.

## How to explain this in your presentation

Tell your mentor these 4 steps — this is exactly how the app works:

1. **Frontend (React)** — The UI shows messages, input box, and buttons. Files: `App.jsx` (logic) and `Message.jsx` (one message design).

2. **API Key (.env)** — Your Gemini key is stored in `.env` as `VITE_GEMINI_API_KEY`. The app reads it when it starts.

3. **Send message** — When you type and press Enter, your text is added to the chat list and sent to Gemini.

4. **Get reply** — Gemini sends back an answer. We show it on screen using `ReactMarkdown` so lists and code look nice.

**Tech used:** React, Vite, Google Gemini API, CSS.

**Project structure:**
```
src/
  App.jsx      → main app + API calls
  Message.jsx  → one chat bubble
  index.css    → all styling
  main.jsx     → starts React
```

## Setup

1. Install packages:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add your Gemini API key:

```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey).

3. Start the app:

```bash
npm run dev
```

Open the link shown in your terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — run locally
- `npm run build` — build for production
- `npm run preview` — preview production build
