# Development Notes

## Quick Start for Developers

### Project Overview
This is a static website project for HKDSE Economics practice. All functionality runs client-side - no backend required.

### File Organization

```
Key Files:
- index.html           → Entry point, loads all resources
- css/style.css        → Main styles (minified single-line)
- css/question-formats.css → Question formatter styles
- js/app.js            → Core app, state management, routing
- js/app-formatters.js → NEW: Question text formatters
- js/questions.js      → Question bank (1000+ questions)
- js/config.js         → AI API configuration
```

### Adding New Features

#### 1. Adding a New Question Formatter

Edit `js/app-formatters.js`:

```javascript
function formatTableQuestion(text) {
  // Detect pattern
  if (!/table pattern/.test(text)) return safeMarkdown(text);
  
  // Parse content
  const parts = parseTable(text);
  
  // Build HTML
  let html = '<div class="question-table">';
  // ... build table
  html += '</div>';
  return html;
}

// Add to formatQuestionText():
if (/table pattern/.test(text)) {
  return formatTableQuestion(text);
}
```

Then add styles to `css/question-formats.css`:

```css
.question-table {
  margin: 12px 0;
  border: 1px solid var(--bd);
  border-radius: 8px;
  overflow-x: auto;
}

.question-table table {
  width: 100%;
  border-collapse: collapse;
}

.question-table th,
.question-table td {
  padding: 10px;
  border: 1px solid var(--bd);
  text-align: left;
}
```

#### 2. Adding Questions

Edit `js/questions.js`:

```javascript
// MCQ Example:
{
  id: 999,
  topic: "Market Structure",
  year: "2024",
  question: "Your question text here. (1) First statement. (2) Second statement.",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answer: "B",  // Letter index: A=0, B=1, C=2, D=3
  explanation: "Explanation here..."
}

// Long Question Example:
{
  id: 100,
  topic: "Market Intervention",
  title: "Government Price Controls",
  marks: 15,
  parts: [
    {
      label: "(a)",
      text: "Explain the concept of price ceiling.",
      marks: 5,
      hint: "Consider market equilibrium and shortage"
    },
    {
      label: "(b)",
      text: "Analyze the effects on consumer surplus.",
      marks: 10,
      hint: "Draw a supply-demand diagram"
    }
  ]
}
```

#### 3. Adding a New Section

1. **Add nav item** in `js/app.js`:
```javascript
var sections = [
  { id: 'newsection', name: 'New Section', icon: 'fa-star' }
];
```

2. **Create render function**:
```javascript
Sections.newsection = function(c) {
  var h = '<div class="page-sec active">';
  h += '<h2>New Section</h2>';
  // ... your content
  h += '</div>';
  c.innerHTML = h;
};
```

3. **Add routing** in `switchView()`:
```javascript
case 'newsection':
  Sections.newsection(content);
  break;
```

#### 4. Styling Tips

Use CSS variables for consistency:
```css
/* Colors */
--pr: primary blue
--ac: accent cyan
--ok: success green
--wn: warning orange
--no: error red

/* Backgrounds */
--bg0: app background
--bg1: card background
--bg2: secondary background

/* Text */
--tx1: primary text
--tx2: secondary text
--tx3: muted text

/* Borders & Shadows */
--bd: border color
--sh: standard shadow
--shl: large shadow
```

### Debugging

#### Console Logs
Check browser console for:
- State changes: `console.log(S)`
- Question rendering: `console.log(formatQuestionText(text))`
- API responses: Check network tab

#### Common Issues

1. **Questions not formatting**
   - Check if `formatQuestionText()` is defined
   - Verify pattern matching in formatter
   - Check CSS file is loaded

2. **Styles not applying**
   - Clear browser cache
   - Check CSS selector specificity
   - Verify CSS file path in index.html

3. **State not persisting**
   - This app doesn't have localStorage
   - State is session-only
   - Implement localStorage if needed

### Performance

- **Minify CSS**: Use CSS minifier for production
- **Lazy load**: Consider lazy loading question bank
- **Code splitting**: Could split JS into modules
- **Caching**: Set proper cache headers when deploying

### Security

- **XSS Prevention**: All user input escaped
- **DOMPurify**: Sanitizes markdown HTML
- **API Keys**: Never commit to git
- **CORS**: Only call CORS-enabled APIs

### Testing Checklist

Before deploying changes:
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test dark mode
- [ ] Test all question formats
- [ ] Check console for errors
- [ ] Verify responsive layouts
- [ ] Test AI integration (if modified)
- [ ] Check MCQ session flow
- [ ] Check Long Q session flow
- [ ] Verify analytics updates

### Git Workflow

```bash
# Before making changes
git checkout -b feature/my-feature

# After making changes
git add .
git commit -m "Add: Description of changes"
git push origin feature/my-feature

# Create pull request on GitHub
```

### Deployment

This is a static website - can deploy to:
- GitHub Pages
- Netlify
- Vercel
- Any static host

No build process required! Just upload files.

### Code Style

- Use semicolons
- 2-space indentation (or consistent tabs)
- camelCase for variables
- PascalCase for constructor functions
- Descriptive variable names
- Comment complex logic

### Resources

- [marked.js docs](https://marked.js.org/)
- [DOMPurify docs](https://github.com/cure53/DOMPurify)
- [Chart.js docs](https://www.chartjs.org/)
- [Font Awesome icons](https://fontawesome.com/icons)

---

**Last Updated**: 2026-02-15  
**Maintainer**: Development Team  
**Questions?**: Open an issue on GitHub
