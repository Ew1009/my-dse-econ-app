# DSE Economics Practice App v2.2

A comprehensive AI-enhanced practice application for HKDSE Economics students with intelligent question formatting and study tools.

## 📚 Current Features

### ✅ Completed Features

#### 1. **Practice System**
- **MCQ Practice (Paper 1)**
  - Three modes: Topic Practice, Exam Mode, Quiz Mode
  - Topic-based filtering from comprehensive syllabus
  - Instant feedback in Topic Practice mode
  - Timed quizzes with customizable duration
  - Retry wrong questions feature
  - 1000+ past paper questions (2007-2021)

- **Long Questions (Paper 2)**
  - Multi-part question support
  - Rich text editor for written answers
  - Interactive diagram drawing tool
  - Hint system for each part
  - AI-powered feedback (requires API key)

#### 2. **Question Formatters** ⭐ NEW
Advanced question formatting from v0.1 now integrated:
- **Statement-based questions**: Automatically formats questions with numbered statements (1) (2) (3) (4)
- **Context separation**: Intelligently separates question stem, context, and sub-questions
- **"The above..." pattern recognition**: Properly formats questions referencing previous context
- **Markdown support**: Safe HTML rendering with DOMPurify sanitization
- **Responsive layouts**: Beautiful formatting on all screen sizes

#### 3. **Analytics Dashboard**
- Performance tracking over time
- Topic-wise accuracy statistics
- Streak tracking (daily study consistency)
- Visual charts and graphs
- Session history and review

#### 4. **AI Integration**
- Multiple AI providers supported:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude 3.5)
  - Google (Gemini 1.5 Pro)
  - User-input mode (bring your own API key)
- Detailed feedback on long question answers
- Contextual marking based on DSE standards

#### 5. **User Interface**
- Modern, responsive design
- Dark mode support
- Mobile-friendly interface
- Smooth animations and transitions
- Toast notifications for user feedback

## 🚀 Recent Updates (v2.2)

### Question Formatters Integration
We've successfully integrated the advanced question formatting system from v0.1.html:

**What's New:**
- ✅ Created `js/app-formatters.js` with intelligent formatting functions
- ✅ Added `css/question-formats.css` for beautiful formatted question styles
- ✅ Updated MCQ session rendering to use formatters
- ✅ Updated Long Q session rendering to use formatters
- ✅ Integrated marked.js and DOMPurify for safe markdown rendering

**How It Works:**
```javascript
// The formatter automatically detects question patterns
formatQuestionText(questionText)

// Examples of what it handles:
// 1. Numbered statements: (1) ... (2) ... (3) ...
// 2. Context separation: "Context. Which of the following..."
// 3. "The above" references: "Context. The above situation..."
```

## 📁 Project Structure

```
/
├── index.html                  # Main HTML file
├── css/
│   ├── style.css              # Main styles (minified)
│   └── question-formats.css   # Question formatter styles ⭐ NEW
├── js/
│   ├── app.js                 # Core app logic & state
│   ├── app-formatters.js      # Question formatters ⭐ NEW
│   ├── app-mcq.js             # MCQ landing & setup
│   ├── app-mcq-session.js     # MCQ quiz engine
│   ├── app-longq.js           # Long Q landing & bank
│   ├── app-longq-session.js   # Long Q session renderer
│   ├── app-practice.js        # Practice mode controller
│   ├── app-analytics.js       # Analytics & charts
│   ├── app-graph.js           # Diagram drawing tool
│   ├── app-ai.js              # AI integration
│   ├── config.js              # AI API configuration
│   └── questions.js           # Question bank (1000+ questions)
└── README.md                  # This file
```

## 🛠️ Technologies Used

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS variables for theming
- **Charts**: Chart.js for analytics visualization
- **Markdown**: marked.js for rich text rendering
- **Security**: DOMPurify for XSS protection
- **Icons**: Font Awesome 6.5.1
- **Fonts**: Google Fonts (Plus Jakarta Sans)

## 🔧 Configuration

### AI Setup

1. Open `js/config.js`
2. Choose your provider:
   ```javascript
   provider: 'user-input'  // Options: 'openai', 'anthropic', 'gemini', 'user-input'
   ```
3. For 'user-input' mode, users will be prompted to enter their API key when they first use AI features
4. For pre-configured mode, add your API key:
   ```javascript
   apiKeys: {
     openai: 'sk-...',     // Your OpenAI API key
     anthropic: 'sk-...',  // Your Anthropic API key
     gemini: '...'         // Your Google API key
   }
   ```

**⚠️ Security Warning**: Never commit API keys to GitHub! Use:
- Environment variables
- `.gitignore` to exclude config.js
- Serverless functions for production
- User-input mode for maximum security

## 📋 Question Format

### MCQ Questions
```javascript
{
  id: 1,
  topic: "Basic Economic Concepts",
  year: "2021",
  question: "Which of the following statements are correct? (1) Statement one. (2) Statement two. (3) Statement three.",
  options: ["(1) and (2) only", "(1) and (3) only", "(2) and (3) only", "(1), (2) and (3)"],
  answer: "B",
  explanation: "Explanation text here..."
}
```

### Long Questions
```javascript
{
  id: 1,
  topic: "Market Intervention",
  title: "Question Title",
  marks: 12,
  parts: [
    {
      label: "(a)",
      text: "Part (a) question text",
      marks: 4,
      hint: "Hint for students"
    }
  ]
}
```

## 🎯 Formatting Features

The new question formatter (`formatQuestionText()`) intelligently handles:

1. **Numbered Statements**
   - Detects: `(1)`, `(2)`, `(3)`, `(4)` patterns
   - Separates into individual statement items
   - Adds visual styling for clarity

2. **Context + Question Separation**
   - Detects: "Context text. Which of the following..."
   - Splits into `question-stem` and `question-sub`
   - Improves readability

3. **"The Above" Pattern**
   - Detects: "Context. The above situation..."
   - Properly formats referential questions
   - Makes context relationships clear

4. **Markdown Support**
   - Bold, italic, underline
   - Lists (ordered & unordered)
   - Tables
   - XSS-protected with DOMPurify

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Desktop**: Full sidebar navigation, multi-column layouts
- **Tablet**: 2-column grids, collapsible sidebar
- **Mobile**: Single column, hamburger menu, touch-optimized

## 🎨 Theming

- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Eye-friendly for extended study sessions
- **Auto-detect**: Respects system preferences
- **Toggle**: Manual theme switching available

## 🚀 Future Enhancements

### Planned Features
- [ ] Table formatters for complex data questions
- [ ] Diagram question formatters
- [ ] Firm comparison table formatter
- [ ] GDP pie chart formatter
- [ ] Employment distribution table formatter
- [ ] Export analytics as PDF
- [ ] Study notes section
- [ ] Spaced repetition algorithm
- [ ] Social features (study groups)
- [ ] Offline mode with service worker

## 🐛 Known Issues

None currently reported. If you find any bugs, please report them!

## 📝 Usage Guide

### For Students

1. **Start Practicing**
   - Go to "Practice" section
   - Choose MCQ or Long Questions
   - Select topics you want to practice
   - Start your session!

2. **Review Performance**
   - Check "Analytics" for your progress
   - Identify weak topics
   - Track your improvement over time

3. **Use AI Feedback** (Optional)
   - For Long Questions, submit your answer
   - Receive detailed AI feedback
   - Learn from expert-level marking

### For Developers

1. **Adding New Questions**
   - Edit `js/questions.js`
   - Follow the existing format
   - Test formatting with `formatQuestionText()`

2. **Customizing Styles**
   - Edit `css/style.css` for main styles
   - Edit `css/question-formats.css` for question-specific styles
   - Use CSS variables for theming

3. **Extending Formatters**
   - Add new patterns to `js/app-formatters.js`
   - Test with various question types
   - Update CSS as needed

## 📄 License

This project is for educational purposes. Question content is sourced from past HKDSE exam papers.

## 🙏 Acknowledgments

- HKDSE Economics past papers
- OpenAI, Anthropic, Google for AI APIs
- Font Awesome for icons
- Chart.js for visualizations
- marked.js and DOMPurify for safe rendering

---

**Version**: 2.2  
**Last Updated**: 2026-02-15  
**Status**: ✅ Production Ready

For questions or support, please open an issue on GitHub.
