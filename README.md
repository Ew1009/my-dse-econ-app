# DSE Economics Study App

A comprehensive HKDSE Economics study application with AI-powered tutoring, built for Vercel deployment.

## 🎯 Project Overview

This is an interactive study platform for Hong Kong DSE Economics students featuring:
- **MCQ Practice** (Paper 1) - Topic-based, exam mode, and timed quiz modes
- **Long Questions** (Paper 2) - Multi-part questions with graph drawing tools
- **AI Tutor** - Real-time feedback and explanations powered by OpenRouter AI
- **Analytics Dashboard** - Track progress, accuracy, and study streaks
- **Question Bank** - Comprehensive coverage of all DSE Economics topics

## 🌐 Current Status

### ✅ Completed Features

1. **Practice Modes**
   - MCQ practice with 3 modes (Topic, Exam, Quiz)
   - Long question practice with multi-part answers
   - Graph drawing tool for economics diagrams
   - Rich text editor for long-form answers

2. **AI Integration**
   - AI tutor for instant feedback on answers
   - Explanation generation for MCQ questions
   - Long question assessment with detailed rubrics
   - AI-powered question generation

3. **Analytics & Progress Tracking**
   - Study streak tracking
   - Topic-wise performance analysis
   - Session history with detailed results
   - Visual charts and graphs (Chart.js)

4. **User Interface**
   - Responsive design for mobile and desktop
   - Dark mode support (auto-detection)
   - Modern UI with smooth animations
   - Accessible components

### 🔧 Recent Fixes (2026-02-15)

**Fixed AI Integration Issues:**
- ✅ Synchronized frontend and backend API communication
- ✅ Proper `messages` array construction for OpenRouter API
- ✅ Enhanced error handling and validation
- ✅ Improved logging for debugging
- ✅ Better error messages for users

**Backend (`api/chat.js`):**
- Validates prompt is non-empty string
- Constructs proper `messages` array with system and user roles
- Handles OpenRouter API errors gracefully
- Returns structured response: `{ response: string, usage: object }`
- Comprehensive console logging for debugging

**Frontend (`js/ai-helper.js`):**
- Validates prompt before sending
- Sends correct request format: `{ prompt, systemPrompt, maxTokens, temperature }`
- Enhanced error handling with user-friendly messages
- Detailed console logging for troubleshooting

## 🚀 Deployment Setup

### Environment Variables Required

Add this to your Vercel project settings:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Getting an OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Create a new API key
5. Add it to your Vercel environment variables

### Vercel Configuration

The app uses:
- **Framework**: Static HTML/CSS/JS
- **Build Command**: None (static site)
- **Output Directory**: `.` (root)
- **Node.js Version**: 18.x or higher (for serverless functions)

### File Structure

```
├── api/
│   └── chat.js                    # Serverless function for AI requests
├── css/
│   ├── style.css                  # Main styles
│   └── question-formats.css       # Question display styles
├── js/
│   ├── ai-helper.js              # AI API bridge (LOAD FIRST)
│   ├── app.js                    # Core app initialization
│   ├── app-ai.js                 # AI-powered features
│   ├── app-analytics.js          # Analytics dashboard
│   ├── app-formatters.js         # Question formatters
│   ├── app-graph.js              # Graph drawing tool
│   ├── app-longq.js              # Long question landing
│   ├── app-longq-session.js      # Long question sessions
│   ├── app-mcq.js                # MCQ landing
│   ├── app-mcq-session.js        # MCQ sessions
│   ├── app-practice.js           # Practice section
│   └── questions.js              # Question bank data
└── index.html                     # Main entry point
```

### Script Loading Order (Important!)

In `index.html`, scripts must load in this order:

```html
<!-- 1. External libraries -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- 2. Question bank data -->
<script src="js/questions.js"></script>

<!-- 3. AI Helper (must load before app-ai.js) -->
<script src="js/ai-helper.js"></script>

<!-- 4. Core app -->
<script src="js/app.js"></script>

<!-- 5. Feature modules -->
<script src="js/app-formatters.js"></script>
<script src="js/app-graph.js"></script>
<script src="js/app-mcq.js"></script>
<script src="js/app-mcq-session.js"></script>
<script src="js/app-longq.js"></script>
<script src="js/app-longq-session.js"></script>
<script src="js/app-practice.js"></script>
<script src="js/app-analytics.js"></script>

<!-- 6. AI features (must load after ai-helper.js) -->
<script src="js/app-ai.js"></script>
```

## 🔍 Troubleshooting AI Issues

### Common Error: "400 Bad Request"

**Symptoms:**
- AI tutor returns error when submitting questions
- Console shows "400 Bad Request" errors

**Solution:**
1. Check that `OPENROUTER_API_KEY` is set in Vercel
2. Verify the API key is valid and has credits
3. Check browser console for detailed error messages
4. Check Vercel function logs for backend errors

### Debugging Steps

**Frontend (Browser Console):**
```javascript
// Check if AI Helper is loaded
console.log(window.AIHelper);

// Test AI call
window.AIHelper.callAI("What is opportunity cost?", {
  systemPrompt: "You are an economics tutor.",
  maxTokens: 500
}).then(response => {
  console.log("AI Response:", response);
}).catch(error => {
  console.error("AI Error:", error);
});
```

**Backend (Vercel Function Logs):**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/chat` function
3. View real-time logs to see:
   - Incoming request body
   - OpenRouter API calls
   - Response structure
   - Any errors

### Network Request Inspection

Using browser DevTools (Network tab):

1. **Request to `/api/chat`:**
   ```json
   {
     "prompt": "Explain supply and demand",
     "systemPrompt": "You are an economics tutor",
     "maxTokens": 2000,
     "temperature": 0.7
   }
   ```

2. **Expected Response (200 OK):**
   ```json
   {
     "response": "Supply and demand is...",
     "usage": {
       "prompt_tokens": 50,
       "completion_tokens": 200,
       "total_tokens": 250
     }
   }
   ```

3. **Error Response (400/500):**
   ```json
   {
     "error": "Descriptive error message",
     "details": { ... }
   }
   ```

## 📊 Data Models

### MCQ Question Structure
```javascript
{
  id: string,
  topic: string,          // Topic ID
  question: string,       // Question text
  options: string[],      // Array of 4 options (A, B, C, D)
  ans: number,           // Correct answer index (0-3)
  explanation: string    // Explanation of correct answer
}
```

### Long Question Structure
```javascript
{
  id: string,
  topic: string,
  title: string,
  difficulty: "Medium" | "Hard",
  parts: [
    {
      label: string,      // e.g., "(a)(i)"
      question: string,
      marks: number,
      rubric: string[]    // Marking criteria
    }
  ]
}
```

### Session Storage
All session data is stored in `localStorage` under the `S` global state object:
- `S.mcq.history` - MCQ session history
- `S.longQ.history` - Long question session history
- `S.stats` - User statistics and analytics

## 🔐 API Reference

### OpenRouter Integration

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "prompt": "string (required)",
  "systemPrompt": "string (optional)",
  "maxTokens": "number (optional, default: 2000)",
  "temperature": "number (optional, default: 0.7)"
}
```

**Response:**
```json
{
  "response": "string",
  "usage": {
    "prompt_tokens": "number",
    "completion_tokens": "number",
    "total_tokens": "number"
  }
}
```

**Error Response:**
```json
{
  "error": "string",
  "details": "object (optional)"
}
```

## 🎨 Technologies Used

- **Frontend:** Vanilla JavaScript (ES5 compatible)
- **Styling:** CSS3 with CSS Variables
- **Charts:** Chart.js 4.4.0
- **Text Processing:** Marked.js + DOMPurify
- **Icons:** Font Awesome 6.5.1
- **Fonts:** Google Fonts (Plus Jakarta Sans)
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI Provider:** OpenRouter (arcee-ai/arcee-trinity-large-preview:free)

## 🛠️ Development

### Local Development

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Set up environment variables:**
   Create `.env` file:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Run locally:**
   ```bash
   vercel dev
   ```

4. **Test AI integration:**
   Open browser console and run:
   ```javascript
   window.AIHelper.callAI("Test prompt").then(console.log);
   ```

### Testing Checklist

- [ ] MCQ practice works in all modes (topic, exam, quiz)
- [ ] Long question submission triggers AI feedback
- [ ] AI explanations generate for MCQ questions
- [ ] Analytics charts render correctly
- [ ] Graph drawing tool functions properly
- [ ] Dark mode switches correctly
- [ ] Mobile responsive design works
- [ ] All error messages are user-friendly

## 📝 Next Steps & Recommendations

### High Priority
1. **Add more questions** to the question bank
2. **Implement user authentication** for persistent progress tracking
3. **Add export functionality** for study notes and session history
4. **Optimize AI prompts** for better feedback quality

### Medium Priority
5. **Add bookmarking** for favorite questions
6. **Create study planner** with goal setting
7. **Add flashcard mode** for quick revision
8. **Implement peer comparison** (anonymous leaderboards)

### Low Priority
9. **Add sound effects** for correct/incorrect answers
10. **Create achievement badges** for milestones
11. **Add offline mode** with service workers
12. **Multi-language support** (Chinese/English toggle)

## 🐛 Known Issues

1. **Graph tool on mobile:** Drawing can be less precise on smaller screens
2. **Large question banks:** May cause slow initial load times
3. **AI response time:** Can take 5-10 seconds depending on OpenRouter load

## 📞 Support

For issues related to:
- **OpenRouter API:** Check https://openrouter.ai/docs
- **Vercel Deployment:** Check https://vercel.com/docs
- **Application bugs:** Review browser console and Vercel function logs

## 📄 License

This project is for educational purposes only.

---

**Last Updated:** 2026-02-15
**Version:** 2.2 (AI Integration Fixed)
