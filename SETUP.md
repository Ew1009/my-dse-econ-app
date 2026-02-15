# 🚀 Quick Setup Guide - OpenRouter Integration

This guide will help you set up your DSE Economics app with OpenRouter AI integration on Vercel.

## ⚡ Quick Start (5 minutes)

### Step 1: Get OpenRouter API Key

1. Go to **https://openrouter.ai/keys**
2. Sign up or log in with your Google/GitHub account
3. Click **"Create Key"**
4. Copy your API key (starts with `sk-or-v1-...`)
5. Keep it safe! You'll need it for Vercel

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit with OpenRouter integration"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to **https://vercel.com**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Click **"Import"**

3. **Add Environment Variable:**
   - Before clicking "Deploy", expand **"Environment Variables"**
   - Add variable:
     - **Name:** `OPENROUTER_API_KEY`
     - **Value:** Paste your OpenRouter API key
   - Click **"Add"**
   - Click **"Deploy"**

4. **Wait for deployment** (usually takes 30-60 seconds)

5. **Access your app:**
   - Vercel will give you a URL like: `https://your-project.vercel.app`
   - Open it and test the AI features!

#### Option B: Using Vercel CLI (Advanced)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (it will prompt you for project settings)
vercel

# Add environment variable
vercel env add OPENROUTER_API_KEY production

# Deploy to production
vercel --prod
```

### Step 3: Verify AI Works

1. Open your deployed app
2. Navigate to **Practice → Long Questions**
3. Start any question and write a sample answer
4. Click **"Submit for AI Feedback"**
5. You should see AI analyzing your answer!

Alternatively:
1. Navigate to **AI Generation → AI Tutor**
2. Ask: "What is opportunity cost?"
3. You should get an AI response!

---

## 📋 File Checklist

Make sure these files exist in your project:

### New Files (Created for OpenRouter Integration)
- ✅ `api/chat.js` - Backend serverless function
- ✅ `js/ai-helper.js` - Frontend AI wrapper
- ✅ `package.json` - Node.js configuration
- ✅ `vercel.json` - Vercel routing configuration
- ✅ `.gitignore` - Git ignore rules

### Updated Files
- ✅ `index.html` - Added ai-helper.js script
- ✅ `js/app-ai.js` - Updated AI Settings modal

### Existing Files (Should already exist)
- ✅ `css/style.css`
- ✅ `css/question-formats.css`
- ✅ `js/questions.js`
- ✅ `js/config.js`
- ✅ `js/app.js`
- ✅ `js/app-formatters.js`
- ✅ `js/app-mcq.js`
- ✅ `js/app-mcq-session.js`
- ✅ `js/app-practice.js`
- ✅ `js/app-longq.js`
- ✅ `js/app-longq-session.js`
- ✅ `js/app-graph.js`
- ✅ `js/app-analytics.js`

---

## 🔧 Updating Environment Variables Later

If you need to update your API key:

### Via Vercel Dashboard:
1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Find `OPENROUTER_API_KEY`
4. Click **"Edit"** or **"Delete"** then **"Add"** new one
5. Important: **Redeploy** your project after changing
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

### Via Vercel CLI:
```bash
# Remove old variable
vercel env rm OPENROUTER_API_KEY production

# Add new variable
vercel env add OPENROUTER_API_KEY production

# Redeploy
vercel --prod
```

---

## 🧪 Testing Locally

To test the app on your computer before deploying:

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Create .env file in project root
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Run development server
vercel dev

# Open http://localhost:3000 in your browser
```

**Note:** The `.env` file is ignored by Git (in `.gitignore`), so it won't be uploaded to GitHub.

---

## 🎯 Where AI is Used in the App

### 1. Long Question Feedback
- **Location:** Practice → Long Questions → (Start any question) → Submit for AI Feedback
- **What it does:** Analyzes your written answer and provides:
  - Mark allocation
  - What you did well
  - What was missing
  - Model answer
  - Overall feedback

### 2. AI Question Generation
- **Location:** AI Generation → Generate
- **What it does:** Creates custom MCQ or Long Questions based on:
  - Selected topic
  - Difficulty level
  - Focus area (optional)

### 3. AI Economics Tutor
- **Location:** AI Generation → AI Tutor
- **What it does:** 
  - Answers your Economics questions
  - Explains concepts
  - Provides examples relevant to Hong Kong
  - Supports conversational follow-up questions

---

## ❓ Troubleshooting

### Problem: "API key not configured on server"

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure `OPENROUTER_API_KEY` exists
3. If not, add it
4. Redeploy your project

### Problem: AI request fails with "Failed to fetch"

**Possible causes:**
1. **Vercel not deployed:** Make sure you've deployed to Vercel, not just opened `index.html` locally
2. **Environment variable missing:** Check step above
3. **API key invalid:** Get a new key from OpenRouter

### Problem: Vercel deployment fails

**Solution:**
1. Check `vercel.json` syntax (must be valid JSON)
2. Check `api/chat.js` syntax (must be valid JavaScript)
3. Look at deployment logs in Vercel dashboard

### Problem: AI works locally but not on Vercel

**Solution:**
1. Ensure environment variable is added to **Production** environment
2. Do a fresh deployment (not just rebuild)
3. Check browser console for errors

### Problem: OpenRouter says "Insufficient credits"

**Solution:**
1. The `arcee-ai/arcee-trinity-large-preview:free` model should be free
2. If you hit limits, you may need to:
   - Wait for reset (free tier has rate limits)
   - Add credits to OpenRouter account
   - Switch to different free model in `api/chat.js`

---

## 📞 Getting Help

### OpenRouter Documentation
- API Docs: https://openrouter.ai/docs
- Models: https://openrouter.ai/models
- Discord: https://discord.gg/openrouter

### Vercel Documentation
- Docs: https://vercel.com/docs
- Serverless Functions: https://vercel.com/docs/functions
- Environment Variables: https://vercel.com/docs/environment-variables

---

## ✅ Verification Checklist

Before you share your app with others:

- [ ] AI Feedback works on Long Questions
- [ ] AI Question Generation works
- [ ] AI Tutor responds to questions
- [ ] No console errors in browser DevTools
- [ ] App is deployed to Vercel (not just local)
- [ ] HTTPS URL works (https://your-project.vercel.app)
- [ ] Environment variable is set in Vercel
- [ ] All pages load correctly (Dashboard, Practice, Analytics, AI Generation)

---

**That's it! You're ready to use AI-powered DSE Economics learning! 🎉**

If you encounter any issues not covered here, check:
1. Browser DevTools Console (F12 → Console tab)
2. Vercel deployment logs
3. README.md for more detailed information