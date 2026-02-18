import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";

interface CTASectionProps {
  content: {
    title: string;
    description?: string;
    primaryCTA: {
      text: string;
      url: string;
      style?: "primary" | "secondary" | "outline";
    };
    secondaryCTA?: {
      text: string;
      url: string;
      style?: "primary" | "secondary" | "outline";
    };
    style?: "banner" | "card" | "minimal";
  };
  config: Record<string, unknown>;
}

export function CTASection({ content }: CTASectionProps) {
  const style = content.style ?? "banner";

  const Buttons = () => (
    <div className="flex flex-col justify-center gap-4 sm:flex-row">
      <Button
        size="lg"
        variant={
          content.primaryCTA.style === "outline" ? "outline" : "default"
        }
        className="h-auto px-8 py-4 text-lg"
        style={{
          backgroundColor:
            content.primaryCTA.style === "primary"
              ? "var(--primary-color, #3b82f6)"
              : undefined,
        }}
        asChild
      >
        <Link href={content.primaryCTA.url}>{content.primaryCTA.text}</Link>
      </Button>

      {content.secondaryCTA && (
        <Button
          size="lg"
          variant={
            content.secondaryCTA.style === "primary"
              ? "default"
              : content.secondaryCTA.style === "secondary"
                ? "secondary"
                : "outline"
          }
          className="h-auto px-8 py-4 text-lg"
          asChild
        >
          <Link href={content.secondaryCTA.url}>
            {content.secondaryCTA.text}
          </Link>
        </Button>
      )}
    </div>
  );

  if (style === "card") {
    return (
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl">
                {content.title}
              </CardTitle>
              {content.description && (
                <CardDescription className="text-lg">
                  {content.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Buttons />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (style === "minimal") {
    return (
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {content.title}
          </h2>
          {content.description && (
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              {content.description}
            </p>
          )}
          <Buttons />
        </div>
      </section>
    );
  }

  // Default banner style
  return (
    <section
      className="px-4 py-20"
      style={{
        backgroundColor: "var(--primary-color, #3b82f6)",
        color: "white",
      }}
    >
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          {content.title}
        </h2>
        {content.description && (
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
            {content.description}
          </p>
        )}
        <Buttons />
      </div>
    </section>
  );
}
