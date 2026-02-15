# DSE Economics Learning Platform v2.2

A comprehensive web application for Hong Kong DSE Economics students with AI-powered feedback and question generation.

## 🚀 Features

### Current Features ✅

1. **Multiple Choice Questions (MCQ) Practice**
   - Topic-based practice mode with instant feedback
   - Exam mode with end-of-quiz review
   - Timed quiz mode
   - Comprehensive question bank covering all DSE Economics topics
   - Past session history

2. **Long Questions (Structured Questions)**
   - Full question bank with multi-part questions
   - Rich text editor for answers
   - Graph drawing tool for economic diagrams
   - AI-powered feedback on answers
   - Sample answers and mark schemes

3. **AI Generation**
   - Generate custom MCQ questions
   - Generate custom long questions
   - AI Tutor for Economics concepts
   - Question generation history

4. **Analytics Dashboard**
   - Performance tracking by topic
   - Study time statistics
   - Accuracy trends
   - Topic-wise performance radar chart
   - Study streak tracking

5. **Modern UI/UX**
   - Dark mode support
   - Responsive design for mobile and desktop
   - Smooth animations and transitions
   - Intuitive navigation

## 🔧 Technical Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES5)**
- **Libraries:**
  - Font Awesome 6.5.1 (icons)
  - Chart.js 4.4.0 (analytics charts)
  - Marked.js (Markdown parsing)
  - DOMPurify 3.0.6 (XSS protection)
  - Plus Jakarta Sans (typography)

### Backend (Serverless)
- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js
- **API Endpoint:** `/api/chat`

### AI Integration
- **Provider:** OpenRouter
- **Model:** `arcee-ai/arcee-trinity-large-preview:free`
- **Authentication:** Server-side (Vercel Environment Variables)

## 📁 Project Structure

```
dse-econ-app/
├── index.html                 # Main HTML entry point
├── package.json              # Node.js project configuration
├── vercel.json               # Vercel deployment configuration
│
├── api/
│   └── chat.js               # Serverless function for OpenRouter API
│
├── css/
│   ├── style.css             # Main application styles
│   └── question-formats.css  # Question-specific formatting
│
└── js/
    ├── questions.js          # Question bank data
    ├── config.js             # Configuration and topics
    ├── app.js                # Core application logic
    ├── app-formatters.js     # Question text formatters
    ├── app-mcq.js            # MCQ logic
    ├── app-mcq-session.js    # MCQ session handling
    ├── app-practice.js       # Practice section
    ├── app-longq.js          # Long question logic
    ├── app-longq-session.js  # Long question session handling
    ├── app-graph.js          # Graph drawing tool
    ├── app-analytics.js      # Analytics and statistics
    ├── ai-helper.js          # AI API wrapper (NEW)
    └── app-ai.js             # AI features (feedback, generation, tutor)
```

## 🔐 API Configuration

### Setting Up OpenRouter API Key

1. **Get your OpenRouter API Key:**
   - Visit: https://openrouter.ai/keys
   - Sign up or log in
   - Create a new API key

2. **Add to Vercel Environment Variables:**
   - Go to your Vercel project dashboard
   - Navigate to: **Settings → Environment Variables**
   - Add new variable:
     - Name: `OPENROUTER_API_KEY`
     - Value: Your OpenRouter API key
     - Apply to: All environments (Production, Preview, Development)
   - Save and redeploy

3. **Local Development (Optional):**
   - Create a `.env` file in the root directory:
     ```
     OPENROUTER_API_KEY=your_api_key_here
     ```
   - Run: `vercel dev` to test locally

## 🌐 API Endpoints

### POST `/api/chat`

Handles all AI requests from the frontend.

**Request Body:**
```json
{
  "prompt": "Your question or prompt here",
  "systemPrompt": "You are an expert HKDSE Economics teacher",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "response": "AI generated response text",
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  }
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

## 🎯 How AI Integration Works

### Architecture Flow

```
Frontend (Browser)
    ↓ [User clicks "Get Feedback"]
    ↓ [JavaScript calls AIHelper.callAI()]
    ↓
    ↓ HTTP POST /api/chat
    ↓
Vercel Serverless Function (api/chat.js)
    ↓ [Reads OPENROUTER_API_KEY from process.env]
    ↓ [Formats request for OpenRouter]
    ↓
    ↓ HTTP POST to OpenRouter API
    ↓
OpenRouter (arcee-ai/arcee-trinity-large-preview:free)
    ↓ [Processes prompt and generates response]
    ↓
    ↓ Returns AI response
    ↓
Vercel Function extracts choices[0].message.content
    ↓
    ↓ Returns response to frontend
    ↓
Frontend displays feedback to student
```

### Key Components

1. **js/ai-helper.js** (NEW)
   - Client-side wrapper for AI API calls
   - Handles fetch requests to `/api/chat`
   - Provides `window.AIHelper.callAI()` interface
   - Error handling and response parsing

2. **api/chat.js** (NEW)
   - Serverless function running on Vercel
   - Securely manages API key from environment variables
   - Formats requests for OpenRouter API
   - Handles CORS for frontend requests
   - Returns formatted responses

3. **js/app-ai.js** (UPDATED)
   - Uses `window.AIHelper.callAI()` for all AI features
   - No longer stores API keys in localStorage
   - Updated AI Settings modal to show backend configuration

## 🚀 Deployment Instructions

### Deploy to Vercel

1. **Push code to GitHub repository**

2. **Import project to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables:**
   - During import or in Settings → Environment Variables
   - Add: `OPENROUTER_API_KEY` = your OpenRouter API key

4. **Deploy:**
   - Vercel will automatically build and deploy
   - Your app will be live at: `https://your-project.vercel.app`

### Manual Deployment

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variable
vercel env add OPENROUTER_API_KEY
```

## 📱 Usage Guide

### For Students

1. **Practice MCQs:**
   - Navigate to Practice → MCQ
   - Choose topic, mode, and difficulty
   - Start practicing!

2. **Practice Long Questions:**
   - Navigate to Practice → Long Questions
   - Browse question bank
   - Click "Start" on any question
   - Write answers in the rich text editor
   - Use graph tool for diagrams (if needed)
   - Click "Submit for AI Feedback"
   - Review detailed feedback and model answers

3. **Generate Custom Questions:**
   - Navigate to AI Generation → Generate
   - Select question type, topic, difficulty
   - Click "Generate with AI"
   - Practice generated questions

4. **Ask AI Tutor:**
   - Navigate to AI Generation → AI Tutor
   - Type your Economics question
   - Get instant explanations

5. **Track Progress:**
   - Navigate to Analytics
   - View performance by topic
   - Check study streaks and trends

## 🔒 Security & Privacy

- **API Key Security:** API keys are stored securely in Vercel Environment Variables, never exposed to the browser
- **No Data Collection:** All student data is stored locally in browser (localStorage)
- **XSS Protection:** DOMPurify sanitizes all user-generated content
- **HTTPS:** All API calls are encrypted via HTTPS

## 📊 Data Storage

All data is stored locally in the browser using `localStorage`:

- `ai_provider`: (Legacy, not used with OpenRouter backend)
- `ai_api_key`: (Legacy, not used with OpenRouter backend)
- `dse_econ_state`: Application state including:
  - MCQ history
  - Long question history
  - AI generation history
  - Analytics data
  - User preferences

## 🛠️ Development

### Local Development Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Run development server
vercel dev

# Access app at http://localhost:3000
```

### File Modification Guide

**To update AI prompts:**
- Edit `js/app-ai.js` functions: `submitLongQ()`, `buildGenPrompt()`, `wireAigTutor()`

**To update questions:**
- Edit `js/questions.js` (MCQ_BANK and LONGQ_BANK arrays)

**To update topics:**
- Edit `js/questions.js` (TOPICS array)

**To change AI model:**
- Edit `api/chat.js` line 53: change model name

**To update UI styles:**
- Edit `css/style.css` and `css/question-formats.css`

## 🐛 Troubleshooting

### AI Not Working

1. **Check Environment Variable:**
   - Verify `OPENROUTER_API_KEY` is set in Vercel
   - Redeploy after adding/updating

2. **Check API Key:**
   - Ensure OpenRouter API key is valid
   - Check account has credits (free tier available)

3. **Check Console:**
   - Open browser DevTools → Console
   - Look for error messages from AI Helper

4. **Check Network:**
   - Open DevTools → Network tab
   - Check `/api/chat` requests
   - Look for 4xx or 5xx errors

### Common Errors

- **"API key not configured on server"**
  - Solution: Add OPENROUTER_API_KEY to Vercel Environment Variables

- **"No response from AI"**
  - Solution: Check OpenRouter API status and key validity

- **CORS errors**
  - Solution: Should not occur with serverless functions; check Vercel deployment

## 🔮 Future Enhancements (Not Yet Implemented)

- [ ] User authentication and cloud sync
- [ ] Social features (share progress, compete with friends)
- [ ] Video explanations for questions
- [ ] Mobile app (React Native)
- [ ] Teacher dashboard for question management
- [ ] Export reports (PDF, CSV)
- [ ] Integration with real HKDSE past papers
- [ ] Flashcard mode for key concepts
- [ ] Spaced repetition algorithm

## 📝 License

MIT License - Free to use for educational purposes

## 👤 Author

Student - DSE Economics Aspirant

---

**Version:** 2.2 (AI-Enhanced with OpenRouter Integration)  
**Last Updated:** February 2026  
**Status:** ✅ Production Ready