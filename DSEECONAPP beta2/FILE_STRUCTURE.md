# 📂 Project File Organization

## Complete File Structure

```
dse-econ-app/
│
├── 📄 index.html                    # Main entry point - HTML structure
├── 📄 package.json                  # Node.js project metadata (NEW)
├── 📄 vercel.json                   # Vercel deployment config (NEW)
├── 📄 .gitignore                    # Git ignore patterns (NEW)
├── 📄 README.md                     # Project documentation (NEW)
├── 📄 SETUP.md                      # Quick setup guide (NEW)
│
├── 📁 api/                          # Serverless Functions (NEW)
│   └── 📄 chat.js                   # OpenRouter API handler (NEW)
│
├── 📁 css/                          # Stylesheets
│   ├── 📄 style.css                 # Main application styles
│   └── 📄 question-formats.css      # Question display formatting
│
└── 📁 js/                           # JavaScript modules
    ├── 📄 questions.js              # Question bank data (MCQ + Long Q)
    ├── 📄 config.js                 # App configuration & topics
    ├── 📄 app.js                    # Core app logic & state management
    ├── 📄 app-formatters.js         # Question text formatters
    ├── 📄 app-mcq.js                # MCQ landing page logic
    ├── 📄 app-mcq-session.js        # MCQ session rendering
    ├── 📄 app-practice.js           # Practice section orchestrator
    ├── 📄 app-longq.js              # Long Q landing page logic
    ├── 📄 app-longq-session.js      # Long Q session rendering
    ├── 📄 app-graph.js              # Graph drawing tool
    ├── 📄 app-analytics.js          # Analytics dashboard
    ├── 📄 ai-helper.js              # AI API wrapper (NEW)
    └── 📄 app-ai.js                 # AI features (UPDATED)
```

---

## 📝 File Descriptions

### Root Files

| File | Purpose | Created/Updated |
|------|---------|-----------------|
| `index.html` | Main HTML structure, loads all scripts and styles | **UPDATED** (added ai-helper.js) |
| `package.json` | Node.js configuration for Vercel | **NEW** |
| `vercel.json` | Deployment configuration for Vercel routing | **NEW** |
| `.gitignore` | Files to ignore in Git repository | **NEW** |
| `README.md` | Complete project documentation | **NEW** |
| `SETUP.md` | Quick setup instructions for deployment | **NEW** |

### API Directory (NEW)

| File | Purpose |
|------|---------|
| `api/chat.js` | Serverless function that handles all AI requests from frontend, communicates with OpenRouter API using server-side API key |

### CSS Directory

| File | Purpose |
|------|---------|
| `css/style.css` | Main styles: layout, colors, components, dark mode |
| `css/question-formats.css` | Specific styling for question display formats |

### JavaScript Directory

| File | Purpose | Dependencies | Updated? |
|------|---------|--------------|----------|
| `questions.js` | Contains TOPICS array, MCQ_BANK array, LONGQ_BANK array | None | No |
| `config.js` | Same as questions.js (duplicate) | None | No |
| `app.js` | Core state management, navigation, modal system, toast notifications | None | No |
| `app-formatters.js` | Parses and formats question text (statements, markdown) | marked.js, DOMPurify | No |
| `app-mcq.js` | MCQ landing page (setup, history, filtering) | app.js | No |
| `app-mcq-session.js` | MCQ quiz session rendering and logic | app.js, app-mcq.js | No |
| `app-practice.js` | Practice section coordinator (MCQ + Long Q tabs) | app.js | No |
| `app-longq.js` | Long Q landing page (bank, history, search) | app.js | No |
| `app-longq-session.js` | Long Q session rendering, rich editor, graph tool integration | app.js, app-longq.js, app-graph.js, **ai-helper.js** | No |
| `app-graph.js` | Canvas-based graph drawing tool for economic diagrams | None | No |
| `app-analytics.js` | Analytics dashboard with Chart.js visualizations | app.js, Chart.js | No |
| `ai-helper.js` | **Frontend AI API wrapper, makes fetch calls to /api/chat** | None | **NEW** |
| `app-ai.js` | AI features: feedback, generation, tutor. Uses **AIHelper.callAI()** | **ai-helper.js**, app.js | **UPDATED** |

---

## 🔄 Script Loading Order (index.html)

The order matters! Scripts are loaded in this sequence:

```html
<!-- External Libraries -->
<script src="marked.min.js"></script>
<script src="dompurify.min.js"></script>
<script src="chart.js"></script>

<!-- Core Application -->
<script src="js/questions.js"></script>      <!-- 1. Data -->
<script src="js/config.js"></script>         <!-- 2. Config -->
<script src="js/app.js"></script>            <!-- 3. Core -->
<script src="js/app-formatters.js"></script> <!-- 4. Formatters -->

<!-- Features -->
<script src="js/app-mcq.js"></script>             <!-- 5. MCQ logic -->
<script src="js/app-practice.js"></script>        <!-- 6. Practice coordinator -->
<script src="js/app-mcq-session.js"></script>     <!-- 7. MCQ session -->
<script src="js/app-longq.js"></script>           <!-- 8. Long Q logic -->
<script src="js/app-graph.js"></script>           <!-- 9. Graph tool -->
<script src="js/app-analytics.js"></script>       <!-- 10. Analytics -->
<script src="js/app-longq-session.js"></script>   <!-- 11. Long Q session -->

<!-- AI Integration (Must be loaded BEFORE app-ai.js) -->
<script src="js/ai-helper.js"></script>      <!-- 12. AI wrapper (NEW) -->
<script src="js/app-ai.js"></script>         <!-- 13. AI features -->
```

**Important:** `ai-helper.js` must load BEFORE `app-ai.js` because `app-ai.js` uses `window.AIHelper.callAI()`.

---

## 🔑 Key Files for OpenRouter Integration

### Files You Need to Understand:

1. **`api/chat.js`** - Backend serverless function
   - Where: Runs on Vercel servers
   - Purpose: Securely calls OpenRouter API with your API key
   - Edit to: Change AI model, adjust token limits, modify prompts

2. **`js/ai-helper.js`** - Frontend AI wrapper
   - Where: Runs in user's browser
   - Purpose: Provides `AIHelper.callAI()` function to all other scripts
   - Edit to: Change API endpoint, add retry logic, modify error handling

3. **`js/app-ai.js`** - AI features
   - Where: Runs in user's browser
   - Purpose: Implements AI feedback, generation, and tutor
   - Edit to: Customize prompts, change feedback format, add new AI features

4. **`vercel.json`** - Routing configuration
   - Where: Vercel deployment config
   - Purpose: Routes `/api/*` requests to serverless functions
   - Edit to: Add new API routes, change build settings

5. **`package.json`** - Node.js configuration
   - Where: Project root
   - Purpose: Tells Vercel this is a Node.js project
   - Edit to: Add dependencies, change project metadata

---

## 📊 Data Flow Diagram

### AI Feedback Request Flow:

```
1. User clicks "Submit for AI Feedback"
   ↓
2. js/app-ai.js → submitLongQ() builds prompt
   ↓
3. calls window.AIHelper.callAI(prompt, options)
   ↓
4. js/ai-helper.js → makes fetch POST to /api/chat
   ↓
5. Vercel routes to api/chat.js serverless function
   ↓
6. api/chat.js reads process.env.OPENROUTER_API_KEY
   ↓
7. api/chat.js sends request to OpenRouter API
   ↓
8. OpenRouter processes with arcee-trinity-large-preview:free
   ↓
9. OpenRouter returns AI response
   ↓
10. api/chat.js extracts choices[0].message.content
   ↓
11. Returns JSON { response: "..." } to frontend
   ↓
12. js/ai-helper.js resolves Promise with response
   ↓
13. js/app-ai.js displays feedback to user
```

---

## 🎨 UI Components Hierarchy

```
index.html
├── .sidebar
│   ├── .sb-hdr (logo)
│   ├── .sb-nav (navigation)
│   └── .sb-ft (user card, theme toggle)
│
└── .main
    ├── .hdr (header with title)
    └── .content (dynamic content area)
        │
        ├── Dashboard (app.js)
        ├── Practice (app-practice.js)
        │   ├── MCQ (app-mcq.js, app-mcq-session.js)
        │   └── Long Q (app-longq.js, app-longq-session.js)
        ├── Analytics (app-analytics.js)
        └── AI Generation (app-ai.js)
            ├── Generate Tab
            ├── Tutor Tab
            └── History Tab
```

---

## 🔐 Security Model

### Where API Key Lives:

| Location | Contains Key? | Purpose |
|----------|---------------|---------|
| Your OpenRouter account | ✅ Original key | Source of truth |
| Vercel Environment Variables | ✅ Server-side storage | Used by api/chat.js |
| api/chat.js (runtime) | ✅ process.env.OPENROUTER_API_KEY | Reads from environment |
| User's browser | ❌ Never exposed | Frontend only sends prompts |
| index.html source | ❌ Not in code | Never hardcoded |
| Git repository | ❌ Not committed | Protected by .gitignore |

### Data Storage:

| Data Type | Storage Location | Synced? |
|-----------|------------------|---------|
| Question banks | js/questions.js (bundled) | No |
| User answers | localStorage (browser) | No |
| Session history | localStorage (browser) | No |
| Analytics data | localStorage (browser) | No |
| API key | Vercel servers only | N/A |

---

## 🚀 Deployment Files

### Required for Vercel:

- ✅ `vercel.json` - Routing and build config
- ✅ `package.json` - Identifies as Node.js project
- ✅ `api/chat.js` - Serverless function

### Environment Variables (Not Files):

- ✅ `OPENROUTER_API_KEY` - Set in Vercel dashboard

---

**Last Updated:** February 2026  
**Project Version:** 2.2 (AI-Enhanced)