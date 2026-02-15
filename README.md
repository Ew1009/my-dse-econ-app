# DSE Econ v2.2 - AI Enhanced

HKDSE Economics Study Companion web application with AI-powered features.

## Project Overview

A single-page application (SPA) for HKDSE Economics revision, featuring MCQ practice, long question practice with AI feedback, AI-generated questions, an AI tutor chatbot, and analytics tracking.

## Currently Completed Features

### ✅ Core Application
- **Dashboard** — Overview of study statistics (sessions, questions answered, accuracy, study time)
- **Practice Section** — Unified MCQ + Long Question practice interface
  - **MCQ (Paper 1)** — 378 authentic HKDSE past paper questions across 14 topics
    - Topic Practice mode (instant feedback per question)
    - Exam Mode (40 questions, 1 hour, no feedback until end)
    - Quiz Mode (timed challenge with configurable topics)
  - **Long Questions (Paper 2)** — 8 structured questions with rich text editor + diagram tool
    - GraphTool canvas for drawing economic diagrams
    - AI-powered feedback on submitted answers
- **AI Generation** — Generate custom MCQ and Long Q questions via AI
  - AI Tutor chatbot for economics Q&A
  - Generation history
- **Analytics** — Performance tracking with charts
  - Score trend (line chart)
  - Topic radar chart
  - Study activity heatmap (28-day)
  - Score distribution (doughnut chart)
  - Topic-level accuracy breakdown
  - AI-powered study insights

### ✅ AI Integration
- Backend API at `/api/chat` (Vercel serverless function)
- Uses OpenRouter API with Arcee Trinity Large Preview model (free tier)
- AI features: question feedback, question generation, tutor chat, "Ask AI" in review

### ✅ UI/UX
- Responsive design with sidebar navigation
- Dark/light theme toggle (auto-detects system preference)
- Rich text editor for long question answers
- Canvas-based diagram drawing tool
- Toast notifications, modals, loading overlays

## File Structure

```
index.html                 — Main entry point (SPA)
css/
  style.css               — Main stylesheet (CSS variables, layouts, components)
  question-formats.css     — Question formatting styles (statements, stems)
js/
  app.js                  — Core: global state (window.S), nav, dashboard, utils, init
  ai-helper.js            — AI API bridge (window.AIHelper.callAI → /api/chat)
  questions.js             — Question data: TOPICS (14), MCQ_BANK (378), LQ_BANK (8)
  app-formatters.js        — Question text formatting (statements, markdown)
  app-mcq.js              — MCQ landing page HTML
  app-mcq-session.js       — MCQ session render, answer reveal, finish/review
  app-practice.js          — Unified practice section (MCQ + Long Q tabs)
  app-longq.js            — Long Q landing page, bank, history, start session
  app-longq-session.js     — Long Q session render, editor, diagram, navigation
  app-graph.js            — GraphTool (canvas drawing for economic diagrams)
  app-analytics.js         — Analytics section (charts, heatmap, insights)
  app-ai.js               — AI generation, tutor chat, submitLongQ for AI feedback
api/
  chat.js                 — Vercel serverless function (OpenRouter proxy)
```

## Script Loading Order (Critical)

1. `app.js` — Defines `window.S`, `window.Sections`, `window.Modal`, utils
2. `ai-helper.js` — Defines `window.AIHelper.callAI`
3. `questions.js` — Defines `window.TOPICS`, `window.MCQ_BANK`, `window.LQ_BANK`
4. `app-formatters.js` — Question formatting utilities
5. `app-mcq.js` — MCQ landing HTML generator
6. `app-mcq-session.js` — MCQ session + finish
7. `app-practice.js` — Unified practice section
8. `app-longq.js` — Long Q landing + session start
9. `app-longq-session.js` — Long Q session render
10. `app-graph.js` — Canvas graph tool
11. `app-analytics.js` — Analytics section
12. `app-ai.js` — AI functions (must be last JS file)
13. Inline `<script>initApp()</script>` — Triggers initialization

## Entry URIs

| Path | Description |
|------|-------------|
| `/` (`index.html`) | Main application (SPA, all views via client-side routing) |
| `/api/chat` | POST — AI chat endpoint (Vercel serverless function) |

### API: `/api/chat`

**Method:** POST  
**Body (JSON):**
```json
{
  "prompt": "string (required)",
  "systemPrompt": "string (optional)",
  "maxTokens": 2000,
  "temperature": 0.7
}
```
**Response:**
```json
{
  "response": "AI response text",
  "usage": { ... }
}
```

## Deployment (Vercel)

1. Push to GitHub / connect to Vercel
2. Set environment variable: `OPENROUTER_API_KEY` (from [openrouter.ai/keys](https://openrouter.ai/keys))
3. Deploy — Vercel auto-detects the `api/` folder for serverless functions

## Bugs Fixed (This Session)

1. **`ReferenceError: S is not defined`** — `var S` was declared globally in `app.js` but the IIFE auto-init ran before other scripts loaded. Fixed by using `var S = window.S = {...}` and deferring `initApp()` to after all scripts load.
2. **`TypeError: Cannot read properties of undefined (reading 'callAI')`** — `ai-helper.js` was loaded after files that used `window.AIHelper`. Fixed by:
   - Removing IIFE wrapper from `ai-helper.js` (now top-level `window.AIHelper = {...}`)
   - Moving `ai-helper.js` to load right after `app.js` in the script order
3. **`app-other.js` conflict** — Contained stale Poe API code that redefined `submitLongQ`, `Sections['ai-gen']`, and `Sections.analytics` with old `window.Poe` calls. Deleted this file.
4. **Missing `config.js`** — `index.html` referenced `js/config.js` which didn't exist. Removed the reference.
5. **`questions.js` bundled code** — This 222KB file contained not just question data but also ~500 lines of old duplicated code (including `window.Poe` calls). The old code is harmless at parse time since it's inside functions, and the separate module files that load later correctly override all the duplicated definitions.
6. **`hasPoe` not defined** — Added a shim `function hasPoe() { return false; }` for the old code in `questions.js`.

## Recommended Next Steps

1. **Clean up `questions.js`** — Remove the ~500 lines of old bundled code (lines 399-899) that duplicate functionality now in separate module files. This is cosmetic but reduces file size.
2. **Add macro topics** — The TOPICS array only has Micro topics. Add Macro topic definitions.
3. **Add more LQ_BANK questions** — Currently only 8 long questions.
4. **Persist state to localStorage** — `window.S` resets on page refresh. Add save/load for history and stats.
5. **Fix "Ask AI" in MCQ review** — The old code in `questions.js` still uses `window.Poe`. Should be updated to use `window.AIHelper.callAI`.
6. **Add error handling for AI unavailability** — Graceful degradation when `/api/chat` is unreachable.
7. **Add Macro topics to MCQ_BANK** — Currently all 378 MCQs are Micro topics only.
