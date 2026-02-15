# DSE Econ v2.3 — AI Enhanced with Automatic Model Fallback

An HKDSE Economics study web app with AI-powered features including MCQ practice, long-question feedback, AI question generation, and an AI tutor chatbot.

## ✅ Currently Completed Features

### Core Study Features
- **Dashboard** — Session stats, accuracy, study time, recent activity
- **MCQ Practice** — Topic/exam/quiz modes with 600+ question bank
- **Long Questions** — Structured part-by-part answering with graph drawing tool
- **AI Feedback** — Submit long-question answers for AI grading & model answers
- **AI Generation** — Generate custom MCQ/long questions on any HKDSE topic
- **AI Tutor** — Conversational chatbot for Economics Q&A
- **Analytics** — Trend charts, topic radar, session history

### v2.3 — Automatic Model Fallback (NEW)
- **Timeout wrapper**: Every AI request has a 30-second timeout
- **Retry logic**: If the primary model fails (429 rate-limit, 500/502/503 server error, or timeout), the request is automatically retried using a fast backup model
- **Backend model parameter**: `api/chat.js` accepts an optional `model` field (whitelisted)
- **User feedback**: A subtle toast notification — *"Switching to high-speed mode…"* — appears when fallback is triggered
- **Transparent to callers**: All existing `window.AIHelper.callAI()` calls benefit automatically with zero code changes

## 📁 Project Structure

```
index.html                 Main app shell (SPA)
api/
  chat.js                  Vercel serverless function → OpenRouter API (accepts model param)
css/
  style.css                Main styles + dark mode
  question-formats.css     Statement/option formatting styles
js/
  app.js                   Global state, utils, nav, dashboard, timer
  ai-helper.js             ★ AI bridge with timeout + automatic fallback retry
  questions.js             TOPICS, MCQ_BANK, LQ_BANK (222 KB question data)
  app-formatters.js        Question text formatting (markdown, statements)
  app-mcq.js               MCQ landing page
  app-mcq-session.js       MCQ session render + AI explain
  app-practice.js          Unified practice tab (MCQ + Long Q)
  app-longq.js             Long Q landing + bank browser
  app-longq-session.js     Long Q session render
  app-graph.js             Canvas-based graph drawing tool
  app-analytics.js         Analytics charts (Chart.js)
  app-ai.js                AI Generation + Tutor + submitLongQ + Settings modal
```

## 🔀 Fallback Architecture

```
  Frontend                       Backend (api/chat.js)
  ────────                       ────────────────────
  callAI(prompt, opts)
    │
    ├─→ Attempt 1: POST /api/chat
    │     body: { prompt, systemPrompt, model: "openai/gpt-oss-120b:free", ... }
    │     timeout: 30s
    │
    │   Success? → return response ✅
    │   Fail (429/500/502/503/timeout)?
    │     ↓
    │   toast("Switching to high-speed mode…")
    │     ↓
    ├─→ Attempt 2: POST /api/chat
    │     body: { prompt, systemPrompt, model: "google/gemini-2.0-flash-lite:free", ... }
    │     timeout: 30s
    │
    │   Success? → return response ✅
    │   Fail? → throw error to caller ❌
```

### Models

| Role | Model ID | Notes |
|------|----------|-------|
| Primary | `openai/gpt-oss-120b:free` | High quality, may be slow or rate-limited |
| Fallback | `google/gemini-2.0-flash-lite:free` | Fast, lightweight, free tier |

### Backend Whitelist
The backend only allows models listed in `ALLOWED_MODELS`. Any unknown model ID is silently replaced with the default.

## 🔗 Functional Entry URIs

| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | Main SPA (index.html) |
| `/api/chat` | POST | AI chat endpoint |

### `/api/chat` Request Body
```json
{
  "prompt": "string (required)",
  "systemPrompt": "string (optional)",
  "maxTokens": 2000,
  "temperature": 0.7,
  "model": "openai/gpt-oss-120b:free"
}
```

### `/api/chat` Response
```json
{
  "response": "AI response text",
  "model": "openai/gpt-oss-120b:free",
  "usage": { "prompt_tokens": 123, "completion_tokens": 456 }
}
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | API key from [openrouter.ai/keys](https://openrouter.ai/keys) |

## 🚀 Deployment

This is designed for **Vercel** deployment:
1. Push to GitHub/GitLab
2. Connect repo to Vercel
3. Add `OPENROUTER_API_KEY` environment variable
4. Deploy

## 📝 Recommended Next Steps

1. **Configurable models** — Let users pick primary/fallback models from the Settings modal
2. **Retry count config** — Allow more than 1 fallback attempt (e.g., chain 3 models)
3. **Response streaming** — Use SSE/streaming for faster perceived response times
4. **Offline question bank** — Cache AI-generated questions in localStorage
5. **Progress persistence** — Save study stats to a backend database
