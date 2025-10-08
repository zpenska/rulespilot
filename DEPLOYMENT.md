# Deployment Guide

## GitHub Setup ✅
Your code is now pushed to: https://github.com/zpenska/rulespilot

## Vercel Deployment Setup

### 1. Link Your Project

Since you already have a Vercel project (`prj_gevcDDlBAHzwcA2Q9mPRRtYSoVvB`), link it:

```bash
vercel link
```

When prompted:
- Set up and deploy: **Yes**
- Scope: Select your account
- Link to existing project: **Yes**
- Project name: **rulespilot**

Or connect directly in Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Import your GitHub repository: `zpenska/rulespilot`
3. It should auto-detect the existing project

### 2. Configure Environment Variables

**CRITICAL:** Add all environment variables to Vercel.

#### Via Vercel Dashboard (Recommended):
1. Go to Project Settings → Environment Variables
2. Add the following variables (get values from your `.env` file):

**Claude AI:**
- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key
- `VITE_ENABLE_CHAT` - Set to `true`

**Firebase:**
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID

3. Check all environments (Production, Preview, Development) for each variable

#### Via CLI:
```bash
# Claude AI
vercel env add VITE_ANTHROPIC_API_KEY
vercel env add VITE_ENABLE_CHAT

# Firebase
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
```

When prompted, paste the values from your `.env` file and select all environments.

### 3. Deploy

```bash
vercel --prod
```

## ⚠️ Known Issue: Tailwind CSS 4.0 Build

Tailwind CSS 4.0 is in alpha and has build issues. If deployment fails:

### Option A: Use Dev Mode (Works Perfectly)
Development mode works great locally:
```bash
npm run dev
```

### Option B: Downgrade to Tailwind 3.x (Recommended for Production)
```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

Then update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

And update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### Option C: Wait for Stable v4 Release
The Tailwind team is actively working on v4. Monitor: https://tailwindcss.com/blog

## Security Note ⚠️

The current setup uses `dangerouslyAllowBrowser: true` in the Claude AI service. This is **ONLY FOR DEVELOPMENT**.

For production, you should:
1. Create a backend API route
2. Move API calls server-side
3. Never expose API keys to the browser

Example backend setup (Next.js API route):
```ts
// pages/api/ai/generate.ts
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Server-side only
  })

  const { prompt } = req.body
  const message = await anthropic.messages.create({...})
  res.json(message)
}
```

## Firebase Setup for Production

Before deploying, ensure Firebase is configured:

1. **Enable Firestore Database:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project `rulesp`
   - Enable Firestore Database
   - Start in production mode with proper security rules

2. **Enable Authentication:**
   - Enable Email/Password authentication
   - Configure authorized domains (add your Vercel domain)

3. **Update Security Rules:**
   - See [FIREBASE.md](./FIREBASE.md) for production security rules

## Deployment Checklist

- [x] Code pushed to GitHub
- [ ] Firebase Firestore enabled
- [ ] Firebase Authentication enabled
- [ ] Firebase security rules configured for production
- [ ] Vercel project linked
- [ ] All environment variables configured (Claude AI + Firebase)
- [ ] First deployment successful
- [ ] AI features tested in production
- [ ] Firebase data persistence tested
- [ ] Security: Move Claude API calls to backend (recommended)

## Quick Commands

```bash
# Link to Vercel
vercel link

# Add environment variables
vercel env add VITE_ANTHROPIC_API_KEY

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## Support

- GitHub Issues: https://github.com/zpenska/rulespilot/issues
- Vercel Docs: https://vercel.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
