# Civilysta Lite

> Describe a civic cause. Get a live micro-site with AI-generated imagery, a petition, discussion thread, and QR code — in under 60 seconds. No account required to start.

Civilysta Lite is an open-source platform that turns a few sentences about a civic cause into a fully live, shareable micro-site. It exists because the current landscape doesn't serve grassroots organizers well:

- **Change.org** is a signature funnel — you get a petition form, not a site
- **NationBuilder** costs $34+/month and takes days to set up
- **Carrd** is generic and requires manual design work
- **Civilysta** is free, open-source, civic-native, and AI-powered

The closest real-world analogy is what Carrd.co accidentally became during BLM 2020 — except purpose-built for civic causes, with zero design effort, and no cost to the organizer.

---

## How It Works

### 1. Describe your cause

Enter a title and 1-3 sentences about what you're fighting for. No account needed — the AI preview is completely public.

### 2. Review AI output

AI generates:
- **Hero copy** — headline, subheadline, 3-bullet "what we're asking for," and a call-to-action (via GPT-4o-mini)
- **3 image options** — photorealistic hero banner variations (via Google Imagen, currently using SVG placeholders)

You pick an image, see a full live preview of your site, and can adjust the brand color.

### 3. Publish

Sign in with a magic link (email, no password). Hit publish. You get:
- A live URL at `/p/your-cause-slug`
- A downloadable QR code
- SEO-optimized Open Graph and Twitter Card metadata
- A built-in supporter petition and threaded discussion

```
User types title + description
         |
         v
  AI generates copy + images (public, no auth)
         |
         v
  User reviews preview, picks image + color
         |
         v
  Magic link auth → publish
         |
         v
  /p/{slug} is live with:
    - Hero section with AI copy + image
    - "Support This Cause" email petition
    - Threaded comment discussion
    - QR code + share tools
    - Full SEO metadata
```

---

## Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Turbopack for dev |
| Language | TypeScript 5 | Strict mode |
| Styling | Tailwind CSS v4 | CSS-first config via `@tailwindcss/postcss` |
| UI | Radix UI + custom components | shadcn/ui-style Button, Card, Input, etc. |
| API | tRPC v11 + TanStack Query v5 | Type-safe client-server RPC |
| Database | PostgreSQL via Prisma v6 | 8 models (down from 114 in the original) |
| Auth | Supabase Auth | Magic link OTP, server-side sessions |
| AI (text) | OpenAI GPT-4o-mini | ~$0.001 per cause generation |
| AI (images) | Google Generative AI | Intended for Imagen 4 Fast (~$0.02/image) |
| Email | Resend | Installed, not yet wired for notifications |
| QR Codes | `qrcode` | Client and server-side generation |
| Validation | Zod | Input validation across tRPC routers |
| Serialization | superjson | Handles Dates/Maps over tRPC |

**Cost per free site created:** ~$0.07 (AI text + 3 AI images). Hosting is near-zero on Vercel or Cloudflare Pages.

---

## Architecture

### Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static | Marketing home page |
| `/create` | Client | 3-step cause creation wizard |
| `/p/[slug]` | SSR | Public cause micro-site with SEO |
| `/manage` | Client (protected) | Dashboard listing your causes |
| `/api/trpc/[trpc]` | API | tRPC endpoint |
| `/auth/callback` | API | Supabase magic link callback |

### tRPC Routers

**`cause`** — `getBySlug` (public), `generatePreview` (public), `create` (protected), `listMine` (protected), `update` (protected), `delete` (protected)

**`supporter`** — `support` (public, email-only petition signup), `getCount` (public)

**`comment`** — `getByCause` (public, sortable), `create` (protected, threaded), `vote` (protected, up/down toggle)

### Key Design Decisions

- **No auth required for preview.** The AI generation call is a public tRPC mutation. Auth is only enforced at the moment of persistence (publishing, commenting, voting).
- **Just-in-time user creation.** When a Supabase-authenticated user first hits the tRPC context, a `User` row is auto-created from their Supabase metadata. No explicit registration step.
- **Denormalized supporter count.** `cause.supporterCount` is an integer field updated atomically in a Prisma transaction alongside the `Supporter` insert, avoiding `COUNT(*)` on every page load.
- **Landing page config is a JSON blob.** The `LandingPage.config` stores the full rendering configuration, so the page can be rendered without re-querying AI or reconstructing state.
- **Comment threading capped at depth 3.** Enforced server-side in the `comment.create` router. The `depth` field is stored on each comment for efficient rendering.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or a Supabase project)
- An OpenAI API key
- (Optional) A Google AI API key for image generation

### Setup

```bash
# Clone the repo
git clone <your-repo-url> civilysta-lite
cd civilysta-lite

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Push the database schema
npx prisma db push

# Start the dev server
npm run dev
```

The app will be running at `http://localhost:3000`.

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o-mini text generation |
| `GOOGLE_AI_API_KEY` | No | Google AI key for image generation (falls back to SVG placeholders) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL for OG tags and magic links (defaults to `http://localhost:3000`) |
| `RESEND_API_KEY` | No | Resend key for future email notification support |

---

## Database Schema

8 models on PostgreSQL, managed by Prisma:

| Model | Purpose |
|---|---|
| `User` | App users, linked to Supabase Auth via `supabaseId` |
| `Cause` | The core entity — title, description, slug, status, supporter count |
| `CauseImage` | AI-generated images stored per cause (URL, prompt, selection state) |
| `Supporter` | Email petition signups, unique per cause+email |
| `Comment` | Threaded discussion on causes, with depth tracking |
| `CommentVote` | Up/down votes on comments, unique per comment+user |
| `LandingPage` | JSON config blob for rendering the public cause page |

Enums: `CauseStatus` (DRAFT/PUBLISHED/ARCHIVED), `LandingPageStatus` (DRAFT/PUBLISHED/ARCHIVED), `VoteType` (UP/DOWN)

---

## Project Structure

```
civilysta-lite/
├── prisma/
│   └── schema.prisma              # 8-model database schema
├── src/
│   ├── app/
│   │   ├── page.tsx               # Marketing home page
│   │   ├── layout.tsx             # Root layout (fonts, TRPCProvider, Toaster)
│   │   ├── globals.css            # Tailwind v4 theme tokens
│   │   ├── create/
│   │   │   └── page.tsx           # 3-step cause creation wizard
│   │   ├── p/[slug]/
│   │   │   ├── page.tsx           # SSR cause page with SEO metadata
│   │   │   └── client.tsx         # Client-side interactive sections
│   │   ├── manage/
│   │   │   └── page.tsx           # Creator dashboard
│   │   ├── auth/callback/
│   │   │   └── route.ts           # Supabase magic link handler
│   │   └── api/trpc/[trpc]/
│   │       └── route.ts           # tRPC HTTP handler
│   ├── components/
│   │   ├── ui/                    # Button, Card, Input, Textarea, Badge
│   │   ├── landing/
│   │   │   ├── LandingPageRenderer.tsx
│   │   │   └── sections/          # HeroSection, TextSection, CTASection
│   │   ├── comments/
│   │   │   └── CommentSection.tsx # Threaded comments with voting
│   │   ├── supporter/
│   │   │   └── SupporterForm.tsx  # Email petition signup
│   │   ├── share/
│   │   │   └── ShareSection.tsx   # URL copy + QR code display
│   │   └── qr/
│   │       └── QRCodeGenerator.tsx # QR code with PNG/SVG download
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── cause-generator.ts # GPT-4o-mini text generation
│   │   │   └── image-generator.ts # Google AI images + SVG fallback
│   │   ├── auth/
│   │   │   ├── supabase-server.ts # Server-side Supabase client
│   │   │   └── supabase-browser.ts # Browser-side Supabase client
│   │   ├── landing-page/
│   │   │   ├── slug-generator.ts  # URL slug generation with uniqueness
│   │   │   └── templates.ts       # Civic cause + petition templates
│   │   ├── trpc/
│   │   │   ├── client.ts          # tRPC React hooks
│   │   │   └── provider.tsx       # TRPCProvider + QueryClient
│   │   ├── qr-generator.ts       # Server-side QR utilities
│   │   └── utils.ts              # cn() class name utility
│   ├── server/
│   │   ├── db.ts                  # Prisma client singleton
│   │   └── api/
│   │       ├── trpc.ts           # tRPC context, procedures, auth middleware
│   │       ├── root.ts           # Router composition
│   │       └── routers/
│   │           ├── cause.ts      # CRUD + AI preview generation
│   │           ├── comment.ts    # Threaded comments + voting
│   │           └── supporter.ts  # Email petition signups
│   └── middleware.ts              # Supabase session refresh + /manage auth guard
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── .env.example
```

---

## Known Limitations

These are honest gaps in the current build:

1. **Image generation uses placeholders.** The Google AI SDK call (`gemini-2.0-flash-exp`) does not return image data via the current API path. The fallback generates inline SVGs with a gradient and cause title. Wiring up Imagen 4 Fast via the Vertex AI API or `@google/genai` SDK is the priority fix.

2. **Individual cause management page is not built.** The dashboard links to `/manage/{id}` but that route doesn't exist yet. Editing a cause after publication requires direct DB access for now.

3. **Email notifications are not wired.** Resend is installed as a dependency but no notification logic exists. Supporters who sign up don't receive confirmation emails or cause updates.

4. **No image storage layer.** AI-generated images are currently passed as data URLs / base64. Production use needs Vercel Blob or Cloudflare R2 for persistent, CDN-backed image storage.

5. **No rate limiting on public AI preview calls.** Anyone can call the AI generation endpoint without auth. Rate limiting was intentionally dropped from v1 to reduce complexity, but should be added before any public deployment.

---

## Roadmap

### Near-term

- [ ] Wire up real image generation via Google Vertex AI (Imagen 4 Fast)
- [ ] Add Vercel Blob / Cloudflare R2 for persistent image storage
- [ ] Build `/manage/[id]` cause editing page
- [ ] Wire Resend for supporter confirmation emails
- [ ] Add rate limiting on the public `generatePreview` endpoint
- [ ] Add cause update/announcement posting

### Medium-term

- [ ] Subdomain routing (`save-riverside-park.civilysta.com`)
- [ ] Analytics dashboard (page views, supporter growth over time)
- [ ] Email blast to supporters when cause owner posts an update
- [ ] Social sharing previews with dynamically generated OG images
- [ ] Cause status lifecycle (DRAFT preview link, scheduled publishing)

### Managed tier ($5-10/month)

For users who want a hosted solution without self-hosting:

- Custom domain mapping (`saveourpark.org` → your cause page)
- Unlimited AI image regenerations
- Email notifications to supporters on cause updates
- Analytics dashboard with visitor demographics
- Priority support
- Remove "Created with Civilysta" footer attribution

### Long-term / Community Ideas

- Embeddable petition widget (drop an `<iframe>` or web component on any site)
- Multi-language AI generation (auto-translate cause pages)
- Cause discovery feed (browse and support causes near you)
- Civic organization accounts (manage multiple causes under one org)
- Template marketplace (community-contributed page designs)
- Offline-first PWA for collecting petition signatures at events
- Integration with government contact databases (auto-generate "contact your representative" links)

---

## Origin Story

Civilysta Lite was extracted from a larger Civilysta codebase (~525k LOC, 114 Prisma models) that attempted a B2B civic data monetization model that never found product-market fit. The core "describe a cause, get a site" flow was the most valuable 15% of that codebase. This repo is a clean-room rebuild: a fresh Next.js app with only the essential components transplanted, adapted, and rewritten to work as a standalone open-source project.

The original Civilysta repo is preserved as a reference archive. This repo is the canonical going-forward project.

---

## Contributing

Contributions are welcome. The project is early-stage and there are substantial features to build (see Roadmap above).

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run `npm run build` to verify the build passes
5. Open a pull request

If you're planning a large change, open an issue first to discuss the approach.

---

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html)

You can self-host and modify Civilysta Lite freely. If you modify the source and deploy it as a service, you must open-source your modifications under the same license. This ensures the civic engagement community benefits from all improvements.
