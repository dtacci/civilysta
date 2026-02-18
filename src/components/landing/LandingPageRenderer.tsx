import Link from "next/link";
import { HeroSection } from "./sections/HeroSection";
import { TextSection } from "./sections/TextSection";
import { CTASection } from "./sections/CTASection";

interface LandingPageConfig {
  title?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroImage?: string;
  heroBullets?: string[];
  ctaText?: string;
  aboutBody?: string;
  [key: string]: unknown;
}

interface LandingPageRendererProps {
  config: LandingPageConfig;
  supporterCount?: number;
  causeSlug?: string;
}

export function LandingPageRenderer({
  config,
  supporterCount = 0,
  causeSlug,
}: LandingPageRendererProps) {
  const customStyles = {
    "--primary-color": config.primaryColor ?? "#3b82f6",
    "--secondary-color": config.secondaryColor ?? "#60a5fa",
  } as React.CSSProperties;

  const bullets = config.heroBullets ?? [];
  const aboutBody =
    config.aboutBody ??
    (bullets.length > 0
      ? `<p>${config.description ?? ""}</p><h3>What We're Asking For</h3><ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
      : `<p>${config.description ?? ""}</p>`);

  return (
    <div className="min-h-screen bg-background text-foreground" style={customStyles}>
      <main>
        <HeroSection
          content={{
            headline: config.heroHeadline ?? config.title ?? "Untitled Cause",
            subheadline: config.heroSubheadline ?? config.description,
            backgroundImage: config.heroImage,
            ctaText: config.ctaText ?? "Support This Cause",
            ctaUrl: "#support",
            showSupporters: true,
            supporterCount,
          }}
          config={config}
        />

        <TextSection
          content={{
            title: "About This Cause",
            body: aboutBody,
            alignment: "left",
            maxWidth: "lg",
          }}
          config={config}
        />

        <CTASection
          content={{
            title: "Ready to Make a Difference?",
            description:
              "Join others who are working to create positive change.",
            primaryCTA: {
              text: config.ctaText ?? "Support This Cause",
              url: "#support",
              style: "primary",
            },
            secondaryCTA: {
              text: "Share This Cause",
              url: causeSlug ? `/p/${causeSlug}#share` : "#share",
              style: "outline",
            },
            style: "banner",
          }}
          config={config}
        />
      </main>

      <footer className="border-t bg-muted/50 py-6 text-center text-xs text-muted-foreground sm:py-8 sm:text-sm">
        <div className="container px-4 sm:px-6">
          <p>
            Created with{" "}
            <Link
              href="/"
              className="underline underline-offset-4 transition-colors hover:text-primary"
            >
              Civilysta
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
