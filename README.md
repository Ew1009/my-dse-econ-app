# DSE Economics v2.2 - AI Enhanced

## Overview
A comprehensive HKDSE Economics practice web app with MCQ and Long Question modules, AI-powered tutoring, analytics dashboard, and now **SVG-based economics diagrams**.

## Project Structure

```
index.html                    — Main app entry point
css/
  ├── style.css               — Core app styles (layout, nav, cards, dark mode)
  └── question-formats.css    — Question rendering styles + graph/diagram CSS
js/
  ├── app.js                  — Global state (S), utilities, nav, dashboard
  ├── ai-helper.js            — AI backend bridge (OpenRouter via /api/chat)
  ├── questions.js             — TOPICS, MCQ_BANK, LQ_BANK question data
  ├── app-formatters.js        — formatQuestionText() + all table/statement/diagram formatters
  ├── app-graphs.js            — ★ NEW: SVG economics diagram generator (generateGraphHTML)
  ├── app-mcq.js               — MCQ landing page HTML
  ├── app-mcq-session.js       — MCQ session rendering + result review + graph integration
  ├── app-practice.js          — Unified practice section (MCQ + Long Q tabs)
  ├── app-longq.js             — Long question bank + landing
  ├── app-longq-session.js     — Long question session rendering
  ├── app-graph.js             — Canvas drawing tool for Long Q diagrams
  ├── app-analytics.js         — Analytics/stats dashboard
  └── app-ai.js                — AI generation, tutor, Long Q feedback
api/
  └── chat.js                  — Vercel serverless function for OpenRouter API
```

## Entry URIs

| Path | Description |
|------|-------------|
| `index.html` | Main application entry |
| `index.html#dashboard` | Dashboard view |
| `index.html#practice` | Practice section (MCQ + Long Q) |
| `index.html#analytics` | Analytics & stats |

## Currently Completed Features

### ✅ Core Features
- **MCQ Practice** — Topic, Exam, and Quiz modes with 340+ past HKDSE questions
- **Long Question Practice** — Structured answer with Part-by-Part submission
- **AI Tutor** — Explains wrong answers using OpenRouter API (GPT-oss-120b with fallback)
- **Analytics Dashboard** — Score tracking, topic accuracy radar, session history
- **Dark Mode** — Auto-detects system preference, toggleable
- **Responsive Design** — Mobile-friendly sidebar, touch-optimized controls

### ✅ Question Formatting (app-formatters.js)
- Tables (production/cost, demand/supply schedules, comparison tables)
- Numbered statements with styled cards
- Organizational charts (business expansion diagrams)
- Pie charts (GDP contribution)
- Production stages diagrams
- Context/question stem separation

### ✅ NEW: Economics Diagrams (app-graphs.js)
SVG-based economics diagrams generated programmatically. Questions with a `graph` property in `questions.js` now display the appropriate diagram.

**Supported Diagram Types:**

| Type | Description | Questions Using It |
|------|-------------|-------------------|
| `sd_cross` | Standard S&D cross with 4 equilibrium quadrant points (E₁/E₂/E₃/E₄ or W/X/Y/Z) | m154, m158, m162, m165, m167, m170, m171, m173, m175, m178, m184, m190, m192 |
| `sd_shift` | S&D with one or both curves shifting (D₁→D₂ or S₁→S₂) | m157, m183, m188, m282 |
| `sd_shift_cross` | Shift + 4 quadrant points | (available for future questions) |
| `sd_floor` | S&D with price floor | m241 |
| `sd_ceiling` | S&D with price ceiling | m232 |
| `sd_tax` | S&D with per-unit tax (supply shifts) | m223, m236 |
| `sd_quota` | S&D with quota vertical line | m257, m291 |
| `sd_surplus` | S&D with shaded CS/PS areas | m283, m293 |
| `sd_surplus_labeled` | S&D with labeled area points | (available for future questions) |
| `lorenz` | Lorenz curve(s) for income distribution | m317, m318, m324, m326, m327 |

**How to add a diagram to a question:**

In `questions.js`, add a `graph` property to the question object:
```js
{
  id: 'm999',
  topic: 'micro-9',
  q: 'The diagram below shows...',
  opts: ['E₁','E₂','E₃','E₄'],
  ans: 2,
  exp: 'Explanation...',
  graph: {
    type: 'sd_cross',
    labels: {
      eq: 'E',
      points: ['E₁','E₂','E₃','E₄'],
      xAxis: 'Q',
      yAxis: 'Price',
      pe: '',
      qe: ''
    }
  }
}
```

## Features Not Yet Implemented

- [ ] More diagram-bearing questions from Ch. 10 (elasticity diagrams)
- [ ] Interactive diagram manipulation (drag curves)
- [ ] "Which of the following diagrams" type (multiple small diagrams in options)
- [ ] Diagram-based answer checking for Long Questions
- [ ] Export practice session as PDF
- [ ] Offline mode / PWA support

## Recommended Next Steps

1. **Add more graph data** — Audit all remaining MCQ questions that reference "diagram below" / "the following diagram" and add `graph` configurations
2. **Elasticity diagrams** — Add support for elastic/inelastic demand curve comparisons
3. **Multiple diagram options** — For questions like "Which of the following diagrams correctly represents...", render 4 small diagrams as options
4. **Interactive surplus shading** — Allow students to click areas to identify CS/PS/DWL
5. **Graph animation** — Animate curve shifts to help visual learning

## Data Models

### Question Object (MCQ_BANK)
```js
{
  id: string,          // Unique ID (e.g., 'm154')
  topic: string,       // Topic ID (e.g., 'micro-9')
  q: string,           // Question text
  opts: string[],      // 4 options (A-D)
  ans: number,         // Correct answer index (0-3)
  exp: string,         // Explanation
  graph?: {            // ★ NEW optional graph config
    type: string,      // Diagram type
    labels?: object,   // Labels for axes, curves, points
    shift?: string,    // 'demand'|'supply'|'both'
    shiftDir?: string, // 'left'|'right'|{demand:'right',supply:'left'}
    curves?: number,   // For Lorenz: number of curves
    bow?: number[],    // For Lorenz: bow amount(s)
    ...                // Type-specific properties
  }
}
```

### Graph Config Types
See `js/app-graphs.js` header comment for full documentation of each type's config schema.

## Technology Stack
- **Frontend**: Vanilla HTML/CSS/JS, Font Awesome, Plus Jakarta Sans, Chart.js
- **AI Backend**: Vercel Serverless (api/chat.js) → OpenRouter API
- **Graph Rendering**: Pure SVG generated by JavaScript (no external dependencies)
