import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Globe, MessageSquare, QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Civilysta — Launch Your Cause in 60 Seconds",
  description:
    "AI-powered micro-sites for civic causes. No setup. No code. Free and open source.",
  openGraph: {
    title: "Civilysta — Launch Your Cause in 60 Seconds",
    description:
      "AI-powered micro-sites for civic causes. Free, no code, takes 60 seconds.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ─── Color constants ─── */
const NAVY = "#06101e";
const NAVY_LIGHT = "#0c1a2e";
const RED = "#e11d48";
const OFF_WHITE = "#f0f4f8";
const MUTED = "#7a8ba3";

/* ─── Noise texture (inline SVG for grain overlay) ─── */
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function HomePage() {
  return (
    <div style={{ backgroundColor: NAVY, color: OFF_WHITE }}>
      {/* ─── Nav ─── */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-display text-2xl font-black uppercase tracking-wider"
            style={{ color: OFF_WHITE }}
          >
            Civilysta
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/manage"
              className="hidden text-sm font-medium uppercase tracking-wide sm:inline"
              style={{ color: MUTED }}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: RED }}
            >
              Create a Cause
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section
        className="relative flex min-h-[90vh] items-center overflow-hidden px-6"
        style={{ backgroundColor: NAVY }}
      >
        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: "repeat", backgroundSize: "256px 256px" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1
            className="font-display font-black uppercase leading-[0.9]"
            style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
          >
            <span
              className="block"
              style={{
                animation: "fade-in-up 0.6s ease-out both",
              }}
            >
              Your cause
            </span>
            <span
              className="block"
              style={{
                animation: "fade-in-up 0.6s ease-out 0.1s both",
              }}
            >
              deserves{" "}
              <span style={{ color: RED }}>a stage.</span>
            </span>
          </h1>

          <p
            className="mt-8 max-w-lg text-lg leading-relaxed md:text-xl"
            style={{
              color: MUTED,
              animation: "fade-in-up 0.6s ease-out 0.25s both",
            }}
          >
            Describe your civic cause. Get a live micro-site with AI-generated
            imagery, a petition, discussion thread, and QR code — in under 60
            seconds.
          </p>

          <div
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animation: "fade-in-up 0.6s ease-out 0.4s both" }}
          >
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: RED }}
            >
              Launch Your Cause
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium uppercase tracking-wide transition-colors hover:text-white"
              style={{ color: MUTED }}
            >
              See how it works &darr;
            </a>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-6 py-24" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: RED }}
          >
            Why Civilysta
          </p>
          <h2 className="mb-14 font-display text-3xl font-black uppercase md:text-5xl">
            Everything your cause needs
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="AI-Generated"
              description="Describe your cause and AI creates the entire site — copy, imagery, and layout."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Instant Site"
              description="Your cause gets a live URL you can share immediately. No design skills needed."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Discussion"
              description="Built-in threaded comments let supporters discuss and organize around your cause."
            />
            <FeatureCard
              icon={<QrCode className="h-6 w-6" />}
              title="QR Code"
              description="Every cause gets a downloadable QR code for flyers, posters, and events."
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="px-6 py-24"
        style={{ backgroundColor: NAVY_LIGHT }}
      >
        <div className="mx-auto max-w-6xl">
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: RED }}
          >
            How It Works
          </p>
          <h2 className="mb-16 font-display text-3xl font-black uppercase md:text-5xl">
            Three steps to launch
          </h2>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            <StepCard
              number="01"
              title="Describe your cause"
              description="Enter a title and 1-3 sentences about what you're fighting for. No account needed."
            />
            <StepCard
              number="02"
              title="Review AI output"
              description="AI generates hero copy, 3 image options, and a full page layout. Pick what you like."
            />
            <StepCard
              number="03"
              title="Publish and share"
              description="Sign in with a magic link, hit publish, and share your URL and QR code everywhere."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─── */}
      <section className="px-6 py-24" style={{ backgroundColor: RED }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="mb-4 font-display font-black uppercase leading-tight text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            Ready to rally support?
          </h2>
          <p className="mb-10 text-lg text-white/80">
            Free and open source. No credit card. No setup time.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-3 px-8 py-4 text-lg font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: "white", color: RED }}
          >
            Start for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-8" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="font-display text-sm font-bold uppercase tracking-wider"
            style={{ color: MUTED }}
          >
            Civilysta
          </Link>
          <div className="flex items-center gap-6 text-xs" style={{ color: MUTED }}>
            <Link href="/create" className="transition-colors hover:text-white">
              Create a Cause
            </Link>
            <Link href="/manage" className="transition-colors hover:text-white">
              Dashboard
            </Link>
            <span>AGPL-3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="border-l-4 p-6"
      style={{
        borderColor: RED,
        backgroundColor: NAVY_LIGHT,
      }}
    >
      <div className="mb-4" style={{ color: RED }}>
        {icon}
      </div>
      <h3 className="mb-2 font-display text-lg font-bold uppercase">
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
        {description}
      </p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span
        className="font-display font-black leading-none"
        style={{ color: RED, fontSize: "clamp(4rem, 8vw, 8rem)" }}
      >
        {number}
      </span>
      <h3 className="mt-2 font-display text-xl font-bold uppercase">
        {title}
      </h3>
      <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>
        {description}
      </p>
    </div>
  );
}
