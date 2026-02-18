# Deploy Civilysta Lite to Production

## Context

The codebase is complete, committed, and pushed to GitHub. No feature work is blocking the
launch. The single highest-leverage action with limited time is **getting it live** — a deployed URL
lets you validate the core flow with real users, share it, and get feedback. Building more features
on code nobody can reach has diminishing returns.

Code audit confirmed: no blockers. The tRPC provider already handles Vercel correctly
(`VERCEL_URL` on server, relative path on client). The build script already runs
`prisma generate && next build`. Nothing needs to change in the codebase.

**Strategic priority order given limited time:**
1. Deploy (this plan) — 30–60 min, unlocks everything
2. Fix AI image generation — currently SVG placeholders; real images via `@google/genai` SDK
3. Build `/manage/[id]` edit page — lets creators update their cause after publishing

---

## What You Need Before Deploying

### Infrastructure (if not already set up)

| Service | Purpose | Free tier |
|---|---|---|
| Supabase | Auth (magic link) + PostgreSQL database | Yes |
| Vercel | Hosting + serverless functions | Yes |
| OpenAI | AI text generation for cause copy | Pay-per-use (~$0.001/cause) |

### Env vars to collect

```
DATABASE_URL             postgresql://... (from Supabase → Settings → Database)
NEXT_PUBLIC_SUPABASE_URL https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  eyJ...
OPENAI_API_KEY           sk-...
NEXT_PUBLIC_APP_URL      https://your-vercel-domain.vercel.app  (set after first deploy)
```

---

## Deployment Steps

### 1. Supabase setup

If you don't already have a project:
- Create a new project at supabase.com
- Grab `DATABASE_URL` from Settings → Database → Connection string (use "Transaction" mode)
- Grab `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Settings → API

Push the schema to the production database (run locally with prod DATABASE_URL):
```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

### 2. Vercel deploy

- Go to vercel.com → Add New Project → Import `dtacci/civilysta-lite` from GitHub
- Framework: Next.js (auto-detected)
- Build command: `prisma generate && next build` (already in package.json, Vercel will use it)
- Add all env vars listed above
- Deploy

### 3. Set NEXT_PUBLIC_APP_URL

After first deploy, you'll get a URL like `civilysta-lite.vercel.app`. Go back to Vercel env vars
and set `NEXT_PUBLIC_APP_URL=https://civilysta-lite.vercel.app`, then redeploy.

### 4. Configure Supabase Auth redirect

In Supabase → Auth → URL Configuration:
- **Site URL**: `https://civilysta-lite.vercel.app`
- **Redirect URLs**: add `https://civilysta-lite.vercel.app/auth/callback`

---

## Verification

1. Visit `https://civilysta-lite.vercel.app` — marketing home page loads (dark navy design)
2. Go to `/create` — type a cause title + description, click Generate
3. AI generates copy in step 2 (SVG placeholder images are expected — that's a known gap)
4. In step 3, click "Publish Your Cause" — enter your email, click "Send Magic Link"
5. Check email, click the link — you should land back on `/create` authenticated
6. Publish — redirects to `/create/success?slug=your-cause-slug` with URL + QR code
7. Visit `/p/your-cause-slug` — cause page is live and SEO-ready
8. Visit `/manage` — your cause appears in the dashboard
