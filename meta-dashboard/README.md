# Meta Ads Live Dashboard

A Next.js app that pulls live Meta Ads data (CPL across 30d / 14d / 7d / 4d) 
and serves it at a public URL via Vercel. Your token never touches the browser.

---

## Deploy in 3 minutes (free)

### Step 1 — Push to GitHub
1. Go to github.com → New repository → name it `meta-ads-dashboard` → Create
2. On your machine, run:
   ```
   cd meta-dashboard
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/meta-ads-dashboard.git
   git push -u origin main
   ```

### Step 2 — Deploy to Vercel
1. Go to vercel.com → Sign up free with your GitHub account
2. Click "Add New Project" → Import your `meta-ads-dashboard` repo
3. Framework: **Next.js** (auto-detected)
4. Click "Environment Variables" → Add:
   - Name: `META_TOKEN`
   - Value: your long-lived Meta token
5. Click **Deploy**

That's it. Vercel gives you a URL like:
`https://meta-ads-dashboard-xyz.vercel.app`

---

## Update your token (every ~60 days)

1. Go to vercel.com → your project → Settings → Environment Variables
2. Edit `META_TOKEN` → paste new token → Save
3. Go to Deployments → Redeploy (or just push any change to GitHub)

---

## Run locally

```bash
cd meta-dashboard
npm install
META_TOKEN=your_token npm run dev
```
Open http://localhost:3000

---

## Features
- 30d / 14d / 7d / 4d CPL for all 15 accounts in one table
- Color-coded: green < $50, amber $50-$100, red > $100
- Trend arrow: CPL improving or worsening vs 30d baseline
- Auto-refreshes every 5 minutes
- Sortable by any column
- Filter by account name
- Token stored server-side only (never exposed to browser)
