# DSE Econ v2.2 - AI Enhanced

HKDSE Economics study app with AI-powered features for MCQ practice, long question feedback, and analytics.

## Currently Completed Features

### Core Features
- **Dashboard** — Overview of study stats, recent activity, and quick navigation
- **MCQ Practice (Paper 1)** — Multiple choice questions with 3 modes:
  - **Topic Practice** — Instant feedback with explanations
  - **Exam Mode** — Timed full exam simulation
  - **Quiz Mode** — Timed quiz with review at end
- **Long Questions (Paper 2)** — Essay-style questions with graph drawing tool
- **Analytics** — Charts and statistics tracking performance over time
- **AI Tutor** — AI-powered question generation and tutoring
- **Dark/Light Theme** — Automatic detection + manual toggle

### ✅ Ask AI Feature (MCQ) — NEW
- **Topic Practice Mode**: When answering incorrectly, an "Ask AI to explain" button appears below the explanation. Clicking it sends the question context to the AI backend, which returns a personalized 3-4 sentence explanation of why the chosen answer is wrong and the correct one is right.
- **Results Review Screen**: Every wrong answer in the review section has an "Ask AI to explain" button. Each button independently calls the AI for that specific question.
- Uses `window.AIHelper.callAI()` → `/api/chat` (OpenRouter backend)
- Gracefully handles AI unavailability with user-friendly messages

## Functional Entry URIs

| Path | Description |
|------|-------------|
| `index.html` | Main app entry point |
| `/api/chat` | AI backend endpoint (POST) — expects `{ prompt, systemPrompt, maxTokens, temperature }` |

### Navigation Views (client-side routing)
- `dashboard` — Home/overview
- `practice` — MCQ + Long Questions practice
- `analytics` — Performance analytics
- `ai` — AI Generation & Tutor

## Project Structure

```
index.html                    — Main HTML shell + script loading order
css/
  style.css                   — Main styles (dark/light theme, components)
  question-formats.css        — Question formatting styles
js/
  app.js                      — Global state (S), utilities, nav, dashboard
  ai-helper.js                — AIHelper module (routes to /api/chat)
  questions.js                — TOPICS, MCQ_BANK, LQ_BANK data + legacy code
  app-formatters.js           — Question text formatting (markdown, statements)
  app-mcq.js                  — MCQ landing page / setup UI
  app-mcq-session.js          — MCQ session render, Ask AI, finish, results
  app-practice.js             — Unified practice section (MCQ + Long Q tabs)
  app-longq.js                — Long question bank / landing
  app-longq-session.js        — Long question session render
  app-graph.js                — Graph drawing tool (canvas-based)
  app-analytics.js            — Analytics section with charts
  app-ai.js                   — AI generation, tutor, submitLongQ
api/
  chat.js                     — Vercel serverless function for OpenRouter API
ref/
  v2.1.2.html                 — Reference monolithic v2.1.2 file
```

## Script Loading Order (Critical)

1. `app.js` — Global state + utilities (MUST be first)
2. `ai-helper.js` — `window.AIHelper` (MUST be before app-ai.js)
3. `questions.js` — Data + legacy embedded code
4. `app-formatters.js` — Question formatting
5. `app-mcq.js` — MCQ setup UI
6. `app-mcq-session.js` — MCQ session (overrides legacy code in questions.js)
7. `app-practice.js` — Unified practice section
8. `app-longq.js` — Long Q landing
9. `app-longq-session.js` — Long Q session
10. `app-graph.js` — Graph tool
11. `app-analytics.js` — Analytics
12. `app-ai.js` — AI functions

## Data Models

### Global State (`window.S`)
- `view` — Current view name
- `mcq.ses` — Active MCQ session object
- `mcq.history` — Past MCQ session results
- `longQ.ses` — Active long question session
- `longQ.history` — Past long question results
- `stats` — Aggregated statistics (sessions, time, topics, etc.)

### AI Backend (`/api/chat`)
- **Request**: `{ prompt: string, systemPrompt?: string, maxTokens?: number, temperature?: number }`
- **Response**: `{ response: string, usage: object }`

## Features Not Yet Implemented
- Persistent data storage (currently in-memory only)
- User authentication
- Leaderboard / competitive features
- Offline support / PWA

## Recommended Next Steps
1. Add persistent storage using the Table API for session history and stats
2. Add "Ask AI" to Long Question feedback for follow-up explanations
3. Consider adding a "Bookmarks" feature for saving difficult questions
4. Implement spaced repetition for weak topics
