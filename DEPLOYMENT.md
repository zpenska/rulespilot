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

**CRITICAL:** Add your Anthropic API key to Vercel:

```bash
vercel env add VITE_ANTHROPIC_API_KEY
```

When prompted, paste your API key from `.env` file.

Select: **Production**, **Preview**, and **Development**

Or add via Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `VITE_ANTHROPIC_API_KEY` with your key
3. Check all environments (Production, Preview, Development)

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

## Deployment Checklist

- [x] Code pushed to GitHub
- [ ] Vercel project linked
- [ ] Environment variables configured
- [ ] First deployment successful
- [ ] AI features tested in production
- [ ] Security: Move API calls to backend

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
