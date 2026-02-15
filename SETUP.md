# 🚀 Quick Setup Guide for DSE Econ v2.2

## For First-Time Users

### Step 1: Get the Code

**Option A: Download ZIP**
1. Click the green "Code" button on GitHub
2. Select "Download ZIP"
3. Extract the ZIP file to a folder

**Option B: Clone with Git**
```bash
git clone https://github.com/YOUR_USERNAME/dse-econ-v2.git
cd dse-econ-v2
```

### Step 2: Open the App

**Simply open `index.html` in your browser!**

No build process, no installation, no dependencies. Just double-click `index.html` or open it in your browser.

### Step 3: Set Up AI Features (Optional but Recommended)

1. **Get an API Key** (choose one):
   - **OpenAI (GPT-4)**: https://platform.openai.com/api-keys
   - **Anthropic (Claude)**: https://console.anthropic.com/
   - **Google (Gemini)**: https://makersuite.google.com/app/apikey

2. **Enter Your API Key**:
   - Open the app
   - Click "AI Generation" in the sidebar
   - Click "AI Settings" button (top right)
   - Select your provider
   - Paste your API key
   - Click "Save"

3. **Your key is stored locally** in your browser only - never uploaded anywhere!

### Step 4: Start Practicing!

- **MCQ Practice**: Practice → MCQ → Select mode and start
- **Long Questions**: Practice → Long Questions → Choose a question
- **AI Tutor**: AI Generation → AI Tutor → Ask anything!
- **Generate Questions**: AI Generation → Generate → Set parameters

---

## Deploying to GitHub Pages

### Step 1: Create a Repository

1. Go to https://github.com/new
2. Name it: `dse-econ-app` (or any name you like)
3. Make it **Public** (required for free GitHub Pages)
4. Click "Create repository"

### Step 2: Upload Your Files

**Option A: Via GitHub Website**
1. Click "uploading an existing file"
2. Drag and drop all your files
3. Click "Commit changes"

**Option B: Via Git Command Line**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dse-econ-app.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Source", select "main" branch
5. Click "Save"
6. Wait 1-2 minutes

### Step 4: Access Your Live App!

Your app will be available at:
```
https://YOUR_USERNAME.github.io/dse-econ-app/
```

**Note**: Users will need to enter their own API keys when they first use AI features.

---

## Security Checklist

Before pushing to GitHub, make sure:

- [ ] You're using `provider: 'user-input'` in `js/config.js` (default)
- [ ] OR you've added `js/config.js` to `.gitignore` (already done)
- [ ] You haven't hardcoded any API keys
- [ ] You've tested the API key prompt works

**To verify**:
```bash
git status
# Make sure config.js with your key is not listed
```

---

## Common Issues

### "No API key configured"
- Click AI Settings and enter your key
- Make sure you selected the right provider
- Verify your key is valid

### AI requests failing
- Check if you have credits remaining
- Verify API key permissions
- Try a different provider

### GitHub Pages not loading
- Wait a few minutes after enabling
- Check the Pages settings show "Your site is live at..."
- Try clearing browser cache

---

## Need Help?

1. Check the full README.md
2. Open a GitHub Issue
3. Make sure you've followed all steps above

---

**That's it! Enjoy studying! 📚✨**
