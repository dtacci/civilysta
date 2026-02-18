# Civilysta Lite

> Describe a civic cause. Get a live micro-site with AI-generated imagery, a petition, discussion thread, and QR code — in under 60 seconds. No account required to start.

Civilysta Lite is an open-source platform that turns a few sentences about a civic cause into a fully live, shareable micro-site. It exists because the current landscape doesn't serve grassroots organizers well:

- **Change.org** is a signature funnel — you get a petition form, not a site
- **NationBuilder** costs $34+/month and takes days to set up
- **Carrd** is generic and requires manual design work
- **Civilysta** is free, open-source, civic-native, and AI-powered

The closest real-world analogy is what Carrd.co accidentally became during BLM 2020 — except purpose-built for civic causes, with zero design effort, and no cost to the organizer.

---

## Features

### Create Flow (3 steps, no account needed to start)

- **AI-powered site generation** — Enter a title and description; GPT-4o-mini generates hero copy (headline, subheadline, bullets, CTA) and About section
- **AI image generation** — 3 hero banner options generated via Google Generative AI (falls back to branded SVG placeholders)
- **Regenerate content** — "Try different content" button on the review step re-runs AI generation without going back to Step 1
- **Live preview** — Full-page preview of your cause site before publishing
- **Brand color picker** — Choose a primary color to theme your site
- **Magic link auth** — Email-only sign-in at the moment of publishing; draft is auto-saved and restored after redirect

### Cause Pages (`/p/your-cause-slug`)

- **Server-rendered** with full SEO metadata (title, description, Open Graph, Twitter Cards)
- **Dynamic OG images** — Server-rendered 1200x630 branded cards via `next/og` ImageResponse; uses hero image as darkened background when available, navy gradient otherwise
- **Hero section** with AI-generated copy and selected image
- **Email petition** — Supporters sign up with email; deduplicated per cause
- **Threaded comments** — Up to 3 levels deep, with upvote/downvote system and sort by newest/oldest/top
- **Event support** — Attach events with date, time, location, and recurrence; downloadable `.ics` calendar files and Google Calendar links
- **Social sharing** — WhatsApp, X/Twitter, Facebook share buttons plus native Web Share API and QR code
- **Supporter count** — Denormalized counter updated atomically (no `COUNT(*)` on every page load)

### Cause Management (`/manage` + `/manage/[id]`)

- **Dashboard** — List all your causes with status indicators
- **Content editing** — Update title, slug, description, goal, location, campaign update message, and status (Draft/Published/Archived)
- **Landing page customization** — Hero image upload, editable headline/subheadline, up to 6 key points, CTA text, and 6 preset color themes with live preview
- **Supporter management** — View all supporters with name, email, and join date; export as CSV; generate printable petition document
- **Email blasts** — Send bulk emails to supporters with proper unsubscribe headers (RFC 8058); auto-blast when campaign update message changes
- **Share tab** — QR code generation and copy-to-clipboard
- **Webhook integrations** — Configure a webhook URL to receive JSON payloads on new supporter signups

### Post-Creation Success Page

- **Shareable URL** with copy button
- **QR code** for the cause page
- **Social share buttons** — WhatsApp, X, Facebook, native share, all pre-filled with cause title
- **Quick links** to view the cause or go to the dashboard

### Home Page

- Marketing landing page with features, how-it-works, and CTA sections
- Open Graph and Twitter Card metadata for link previews when sharing `civilysta.com`

### Platform Features

- **IP-based rate limiting** — 5 AI generations/hour, 10 supporter signups/hour, 10 comments/hour per IP
- **Content moderation** — OpenAI Moderation API checks cause titles/descriptions on creation and updates
- **HTML sanitization** — AI-generated content is sanitized to allow only safe HTML tags
- **Email notifications** via Resend — Creator notified on new supporter; bulk email blasts with unsubscribe support
- **Webhook delivery** — Fire-and-forget JSON payloads on new supporters (5s timeout)
- **Privacy policy** page at `/privacy`
- **iCalendar generation** — `/api/event/[slug]/calendar.ics` with recurring event support (RRULE)

---

## How It Works

```
User types title + description
         |
         v
  AI generates copy + images (public, no auth)
         |
         v
  User reviews preview, picks image + color
  (can regenerate content without going back)
         |
         v
  Magic link auth → publish
         |
         v
  /p/{slug} is live with:
    - Hero section with AI copy + image
    - Dynamic OG image for social sharing
    - "Support This Cause" email petition
    - Threaded comment discussion
    - Event calendar integration
    - QR code + social share tools
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
| Database | PostgreSQL via Prisma v6 | 8 models |
| Auth | Supabase Auth | Magic link OTP, server-side sessions |
| AI (text) | OpenAI GPT-4o-mini | ~$0.001 per cause generation |
| AI (images) | Google Generative AI | Imagen 4 Fast intended (~$0.02/image); SVG fallback |
| AI (moderation) | OpenAI Moderation API | Content safety checks on creation and updates |
| OG Images | `next/og` (ImageResponse) | Dynamic server-rendered social preview cards |
| Email | Resend | Supporter notifications, bulk email blasts, unsubscribe |
| QR Codes | `qrcode` | Client and server-side generation |
| Validation | Zod | Input validation across tRPC routers |
| Serialization | superjson | Handles Dates/Maps over tRPC |

**Cost per free site created:** ~$0.07 (AI text + 3 AI images). Hosting is near-zero on Vercel or Cloudflare Pages.

---

## Architecture

### Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static | Marketing home page with OG metadata |
| `/create` | Client | 3-step cause creation wizard |
| `/create/success` | Client | Post-publish success page with social share buttons |
| `/p/[slug]` | SSR | Public cause micro-site with SEO |
| `/p/[slug]/opengraph-image` | Dynamic | Server-rendered OG image (1200x630) |
| `/manage` | Client (protected) | Dashboard listing your causes |
| `/manage/[id]` | Client (protected) | Full cause editor (content, design, supporters, share, integrations) |
| `/privacy` | Static | Privacy and data policy |
| `/api/trpc/[trpc]` | API | tRPC endpoint |
| `/api/event/[slug]/calendar.ics` | API | iCalendar file generation |
| `/api/unsubscribe` | API | Token-based email unsubscribe handler |
| `/auth/callback` | API | Supabase magic link callback |

### tRPC Routers

**`cause`** — `getBySlug` (public), `generatePreview` (public, rate-limited), `create` (protected), `listMine` (protected), `update` (protected), `delete` (protected)

**`supporter`** — `support` (public, rate-limited, email-only petition signup), `getCount` (public)

**`comment`** — `getByCause` (public, sortable), `create` (protected, rate-limited, threaded), `vote` (protected, up/down toggle)

### Key Design Decisions

- **No auth required for preview.** The AI generation call is a public tRPC mutation. Auth is only enforced at the moment of persistence (publishing, commenting, voting).
- **Just-in-time user creation.** When a Supabase-authenticated user first hits the tRPC context, a `User` row is auto-created from their Supabase metadata. No explicit registration step.
- **Denormalized supporter count.** `cause.supporterCount` is an integer field updated atomically in a Prisma transaction alongside the `Supporter` insert, avoiding `COUNT(*)` on every page load.
- **Landing page config is a JSON blob.** The `LandingPage.config` stores the full rendering configuration, so the page can be rendered without re-querying AI or reconstructing state.
- **Comment threading capped at depth 3.** Enforced server-side in the `comment.create` router. The `depth` field is stored on each comment for efficient rendering.
- **IP-based rate limiting.** Uses a `GenerationRequest` table to track requests by hashed IP with automatic cleanup of old records.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or a Supabase project)
- An OpenAI API key
- (Optional) A Google AI API key for image generation
- (Optional) A Resend API key for email notifications

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
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o-mini text generation and content moderation |
| `GOOGLE_AI_API_KEY` | No | Google AI key for image generation (falls back to SVG placeholders) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL for OG tags and magic links (defaults to `http://localhost:3000`) |
| `RESEND_API_KEY` | No | Resend key for supporter notifications and email blasts |

---

## Database Schema

8 models on PostgreSQL, managed by Prisma:

| Model | Purpose |
|---|---|
| `User` | App users, linked to Supabase Auth via `supabaseId` |
| `Cause` | The core entity — title, description, slug, status, supporter count, webhook URL |
| `CauseImage` | AI-generated images stored per cause (URL, prompt, selection state) |
| `Supporter` | Email petition signups, unique per cause+email, with unsubscribe token |
| `Comment` | Threaded discussion on causes, with depth tracking |
| `CommentVote` | Up/down votes on comments, unique per comment+user |
| `LandingPage` | JSON config blob for rendering the public cause page |
| `GenerationRequest` | IP-based rate limiting tracker with hashed IPs and timestamps |

Enums: `CauseStatus` (DRAFT/PUBLISHED/ARCHIVED), `LandingPageStatus` (DRAFT/PUBLISHED/ARCHIVED), `VoteType` (UP/DOWN)

---

## Project Structure

```
civilysta-lite/
├── prisma/
│   └── schema.prisma              # 8-model database schema
├── src/
│   ├── app/
│   │   ├── page.tsx               # Marketing home page with OG metadata
│   │   ├── layout.tsx             # Root layout (fonts, TRPCProvider, Toaster)
│   │   ├── globals.css            # Tailwind v4 theme tokens
│   │   ├── create/
│   │   │   ├── page.tsx           # 3-step cause creation wizard
│   │   │   └── success/
│   │   │       └── page.tsx       # Post-publish page with social share
│   │   ├── p/[slug]/
│   │   │   ├── page.tsx           # SSR cause page with SEO metadata
│   │   │   ├── client.tsx         # Client-side interactive sections
│   │   │   └── opengraph-image.tsx # Dynamic OG image generation
│   │   ├── manage/
│   │   │   ├── page.tsx           # Creator dashboard
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Full cause editor (5 tabs)
│   │   ├── privacy/
│   │   │   └── page.tsx           # Privacy & data policy
│   │   ├── auth/callback/
│   │   │   └── route.ts           # Supabase magic link handler
│   │   └── api/
│   │       ├── trpc/[trpc]/
│   │       │   └── route.ts       # tRPC HTTP handler
│   │       ├── event/[slug]/
│   │       │   └── route.ts       # iCalendar file generation
│   │       └── unsubscribe/
│   │           └── route.ts       # Email unsubscribe handler
│   ├── components/
│   │   ├── ui/                    # Button, Card, Input, Textarea, Badge, etc.
│   │   ├── landing/
│   │   │   ├── LandingPageRenderer.tsx
│   │   │   └── sections/          # HeroSection, TextSection, CTASection
│   │   ├── comments/
│   │   │   └── CommentSection.tsx # Threaded comments with voting
│   │   ├── supporter/
│   │   │   └── SupporterForm.tsx  # Email petition signup
│   │   ├── share/
│   │   │   └── ShareSection.tsx   # Social share buttons + QR code
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
│   │   ├── email.ts              # Resend email sending (notifications + blasts)
│   │   ├── qr-generator.ts      # Server-side QR utilities
│   │   └── utils.ts             # cn() class name utility
│   ├── server/
│   │   ├── db.ts                  # Prisma client singleton
│   │   └── api/
│   │       ├── trpc.ts           # tRPC context, procedures, auth middleware
│   │       ├── root.ts           # Router composition
│   │       └── routers/
│   │           ├── cause.ts      # CRUD + AI preview generation + rate limiting
│   │           ├── comment.ts    # Threaded comments + voting + rate limiting
│   │           └── supporter.ts  # Email petition signups + rate limiting + webhooks
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

1. **Image generation uses placeholders.** The Google AI SDK call (`gemini-2.0-flash-exp`) does not return image data via the current API path. The fallback generates inline SVGs with a gradient and cause title. Wiring up Imagen 4 Fast via the Vertex AI API or `@google/genai` SDK is the priority fix.

2. **No persistent image storage layer.** AI-generated images are currently passed as data URLs / base64. Production use needs Vercel Blob or Cloudflare R2 for persistent, CDN-backed image storage.

3. **No static OG image for home page.** The home page has text-only OG metadata. A designed `/public/og-home.png` would improve social previews when sharing `civilysta.com`.

---

## Roadmap

### Near-term

- [ ] Wire up real image generation via Google Vertex AI (Imagen 4 Fast)
- [ ] Add Vercel Blob / Cloudflare R2 for persistent image storage
- [ ] Design static OG image for home page (`/public/og-home.png`)
- [ ] Supporter confirmation emails on petition signup
- [ ] OAuth providers (Google, GitHub) alongside magic links

### Medium-term

- [ ] Subdomain routing (`save-riverside-park.civilysta.com`)
- [ ] Analytics dashboard (page views, supporter growth over time)
- [ ] Cause status lifecycle (DRAFT preview link, scheduled publishing)
- [ ] Embeddable petition widget (`<iframe>` or web component for external sites)
- [ ] Multi-language AI generation (auto-translate cause pages)

### Managed Tier ($5-10/month)

For users who want a hosted solution without self-hosting:

- Custom domain mapping (`saveourpark.org` -> your cause page)
- Unlimited AI image regenerations
- Analytics dashboard with visitor demographics
- Priority support
- Remove "Created with Civilysta" footer attribution

### Long-term / Community Ideas

- Cause discovery feed (browse and support causes near you)
- Civic organization accounts (manage multiple causes under one org)
- Template marketplace (community-contributed page designs)
- Offline-first PWA for collecting petition signatures at events
- Integration with government contact databases (auto-generate "contact your representative" links)
- A/B testing for hero copy and CTAs
- Supporter engagement scoring and segmentation
- Automated social media posting on cause milestones

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
