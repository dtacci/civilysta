import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";

interface HeroSectionProps {
  content: {
    headline: string;
    subheadline?: string;
    description?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaUrl?: string;
    showSupporters?: boolean;
    supporterCount?: number;
    supporterGoal?: number;
  };
  config: Record<string, unknown>;
}

export function HeroSection({ content, config: _config }: HeroSectionProps) {
  const backgroundImage = content.backgroundImage;
  const hasBackground = !!backgroundImage;

  return (
    <section
      className={`relative flex min-h-[80vh] items-center justify-center px-4 py-16 ${
        hasBackground
          ? "text-white"
          : "bg-gradient-to-br from-primary/5 to-primary/10"
      }`}
    >
      {hasBackground && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      <div className="relative mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-4 text-sm font-medium">
          Civic Cause
        </Badge>

        <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
          {content.headline}
        </h1>

        {content.subheadline && (
          <h2 className="mb-6 text-xl font-medium opacity-90 md:text-2xl">
            {content.subheadline}
          </h2>
        )}

        {content.description && (
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-80 md:text-xl">
            {content.description}
          </p>
        )}

        {content.showSupporters &&
          content.supporterCount !== undefined && (
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-center gap-4">
                <div className="text-3xl font-bold">
                  {content.supporterCount.toLocaleString()}
                </div>
                {content.supporterGoal && (
                  <>
                    <div className="text-lg opacity-80">of</div>
                    <div className="text-2xl font-semibold opacity-90">
                      {content.supporterGoal.toLocaleString()}
                    </div>
                  </>
                )}
                <div className="text-lg opacity-80">supporters</div>
              </div>

              {content.supporterGoal && (
                <div className="mx-auto h-3 w-full max-w-md rounded-full bg-white/20">
                  <div
                    className="h-3 rounded-full bg-white transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (content.supporterCount / content.supporterGoal) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {content.ctaText && (
            <Button
              size="lg"
              className="h-auto px-8 py-4 text-lg"
              style={{
                backgroundColor: "var(--primary-color, #3b82f6)",
                color: "white",
              }}
              asChild={!!content.ctaUrl}
            >
              {content.ctaUrl ? (
                <Link href={content.ctaUrl}>{content.ctaText}</Link>
              ) : (
                content.ctaText
              )}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
