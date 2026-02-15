# 🚀 Quick Reference Card

## 📋 Essential Information

### OpenRouter API Key
- Get it from: **https://openrouter.ai/keys**
- Format: `sk-or-v1-...`
- Store in: **Vercel Environment Variables**

### Vercel Environment Variable
- **Name:** `OPENROUTER_API_KEY`
- **Value:** Your OpenRouter API key
- **Location:** Vercel Dashboard → Settings → Environment Variables

### API Model
- **Model ID:** `arcee-ai/arcee-trinity-large-preview:free`
- **Type:** Free tier
- **Provider:** OpenRouter

---

## 📁 File Locations Cheat Sheet

| File | Purpose | Action |
|------|---------|--------|
| `api/chat.js` | Backend function | Keep as-is |
| `js/ai-helper.js` | Frontend wrapper | Keep as-is |
| `js/app-ai.js` | AI features | Updated ✅ |
| `index.html` | Main HTML | Updated ✅ |
| `package.json` | Node config | Created ✅ |
| `vercel.json` | Routing | Created ✅ |

---

## ⚡ Quick Commands

### Deploy to Vercel (CLI)
```bash
npm install -g vercel
vercel login
vercel --prod
vercel env add OPENROUTER_API_KEY production
```

### Test Locally
```bash
echo "OPENROUTER_API_KEY=your_key" > .env
vercel dev
# Open http://localhost:3000
```

### Git Push
```bash
git add .
git commit -m "Add OpenRouter integration"
git push origin main
```

---

## 🧪 Testing Checklist

1. ✅ Navigate to Practice → Long Questions
2. ✅ Start any question
3. ✅ Write a sample answer
4. ✅ Click "Submit for AI Feedback"
5. ✅ Verify AI response appears

**Alternative Test:**
1. ✅ Navigate to AI Generation → AI Tutor
2. ✅ Ask: "What is opportunity cost?"
3. ✅ Verify AI responds

---

## 🐛 Quick Troubleshooting

| Error | Quick Fix |
|-------|-----------|
| "API key not configured" | Add `OPENROUTER_API_KEY` to Vercel, redeploy |
| "Failed to fetch" | Ensure deployed to Vercel (not local file) |
| AI not working | Check browser console (F12) for errors |
| Deployment fails | Check `vercel.json` syntax |

---

## 📞 Help Resources

| Resource | Link |
|----------|------|
| Setup Guide | `SETUP.md` |
| Full Docs | `README.md` |
| File Guide | `FILE_STRUCTURE.md` |
| Completion Summary | `COMPLETE.md` |
| OpenRouter Docs | https://openrouter.ai/docs |
| Vercel Docs | https://vercel.com/docs |

---

## 🎯 3-Step Deploy

### Step 1: Get API Key
Visit: https://openrouter.ai/keys → Create key → Copy

### Step 2: Deploy
Push code to GitHub → Import to Vercel → Deploy

### Step 3: Configure
Add Environment Variable: `OPENROUTER_API_KEY` → Redeploy

**Done! 🎉**

---

## 💻 Code Snippets

### Call AI from Frontend
```javascript
window.AIHelper.callAI('Your prompt here', {
  systemPrompt: 'You are an expert...',
  maxTokens: 2000,
  temperature: 0.7
}).then(function(response) {
  console.log(response);
}).catch(function(error) {
  console.error(error);
});
```

### Check if AI Available
```javascript
if (window.AIHelper.isAvailable()) {
  // AI is ready
}
```

---

## 🔐 Security Checklist

- ✅ API key in Vercel Environment Variables (not in code)
- ✅ `.env` in `.gitignore` (not committed to Git)
- ✅ Backend proxy (frontend never sees key)
- ✅ HTTPS only (Vercel handles this)

---

## 📊 Model Settings

### Default Settings (in api/chat.js):
```javascript
{
  model: 'arcee-ai/arcee-trinity-large-preview:free',
  max_tokens: 2000,
  temperature: 0.7
}
```

### To Change Model:
Edit `api/chat.js` line ~53 → Change model string → Redeploy

### To Adjust Tokens:
Pass `maxTokens` in frontend call:
```javascript
window.AIHelper.callAI(prompt, { maxTokens: 3000 });
```

---

## 🎓 Key Concepts

### Serverless Function
- Backend code that runs on-demand
- No server management needed
- Located in `api/` folder
- Automatically deployed by Vercel

### Environment Variables
- Secure way to store secrets
- Not in code or Git
- Set in Vercel dashboard
- Accessed via `process.env` in backend

### API Proxy Pattern
- Frontend → Backend → External API
- Keeps API keys secure
- Backend adds authentication header
- Frontend never sees key

---

## 🔄 Update Workflow

### Update API Key:
1. Vercel Dashboard → Settings → Environment Variables
2. Edit `OPENROUTER_API_KEY`
3. Deployments tab → Redeploy latest

### Update Code:
```bash
# Make changes to files
git add .
git commit -m "Update description"
git push origin main
# Vercel auto-deploys
```

### Update Model:
1. Edit `api/chat.js` (model line)
2. Commit and push
3. Vercel auto-deploys

---

## 📱 Browser DevTools Guide

### View Console Logs:
`F12` → Console tab → Look for errors

### View Network Requests:
`F12` → Network tab → Filter: `chat` → Check status codes

### Common Console Messages:
- ✅ "AI Helper initialized - using OpenRouter via backend"
- ❌ "AI Helper Error: ..." (check issue)

---

## 🎯 AI Feature Locations

| Feature | Where to Find |
|---------|---------------|
| Long Q Feedback | Practice → Long Questions → Start → Submit for AI Feedback |
| Generate Questions | AI Generation → Generate → Fill form → Generate with AI |
| AI Tutor | AI Generation → AI Tutor → Type question → Send |
| AI Settings | AI Generation → AI Settings button |

---

## ✅ Pre-Launch Checklist

Before sharing your app:

- [ ] All files created/updated
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variable set
- [ ] AI Feedback tested
- [ ] AI Generation tested
- [ ] AI Tutor tested
- [ ] No console errors
- [ ] Mobile responsive works
- [ ] Dark mode works

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ No "API key not configured" errors
2. ✅ AI responds within 5-10 seconds
3. ✅ Feedback is relevant and detailed
4. ✅ Console shows "AI Helper initialized"
5. ✅ Network tab shows 200 status for `/api/chat`

---

**Quick Start:** Read `SETUP.md` first  
**Full Details:** Read `README.md` next  
**File Guide:** Check `FILE_STRUCTURE.md`  

**Version:** 2.2 | **Date:** Feb 2026