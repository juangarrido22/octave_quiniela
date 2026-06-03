# Octave Prospecting Quiniela
### Cold Call Edition · EMIA ADRs · Q3 2026

---

## Deploy to Netlify in 5 steps

### What you need
- A free Netlify account → netlify.com
- Your Anthropic API key → console.anthropic.com

---

### Step 1 — Get your Anthropic API key
1. Go to **console.anthropic.com**
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add a few dollars of credit under **Billing** (usage is ~€0.002 per call scored, so €20 lasts a long time)

---

### Step 2 — Create a Netlify account
1. Go to **netlify.com** → Sign up free
2. You can sign up with GitHub, GitLab, or email

---

### Step 3 — Deploy the project
**Option A — Drag and drop (easiest):**
1. Go to **netlify.com/drop**
2. Drag the entire `octave-quiniela` folder into the browser
3. Netlify will deploy it instantly and give you a URL

**Option B — GitHub (recommended for updates):**
1. Push this folder to a GitHub repo
2. In Netlify → **Add new site** → **Import from Git**
3. Select your repo → Deploy

---

### Step 4 — Add your API key as an environment variable
This is the critical step — the key lives here, never in the code.

1. In Netlify, go to your site → **Site configuration**
2. Click **Environment variables** → **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your `sk-ant-...` key
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

### Step 5 — Share the URL with the team
Netlify gives you a URL like `https://octave-quiniela.netlify.app`

You can also set a custom domain if you want something cleaner.

Share it with the team — no login needed, works in any browser.

---

## How data is stored
- Each person's calls and KPIs are saved in their **browser's localStorage**
- This means data is per-device — if someone switches computers they start fresh
- For a shared persistent leaderboard across all devices, the next step would be adding a small database (Supabase free tier works great) — ask Juan to set this up when ready

## Cost estimate
- Model: Claude Sonnet (claude-sonnet-4-20250514)
- ~1,000 tokens per call analyzed
- Price: ~$0.003 per call
- 12 people × 26 calls = 312 calls/quarter = **~$1 total per quarter**

---

## Project structure
```
octave-quiniela/
├── netlify.toml              # Netlify config
├── netlify/
│   └── functions/
│       └── analyze.js        # Serverless function (holds API key)
└── public/
    └── index.html            # The full app
```

---

## Questions?
Built for Octave EMIA ADR team, Q3 2026.
