"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { QRCodeGenerator } from "~/components/qr/QRCodeGenerator";
import { ShareSection } from "~/components/share/ShareSection";
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");
  const title = searchParams.get("title") ?? "My Cause";

  const [copied, setCopied] = useState(false);

  if (!slug) {
    router.replace("/create");
    return null;
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
  const causeUrl = `${baseUrl}/p/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(causeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {/* Success message */}
      <div className="mb-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-3xl font-bold">Your cause is live!</h1>
        <p className="text-muted-foreground">
          Share this link to rally support
        </p>
      </div>

      {/* URL + copy */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-2 pt-6">
          <Input value={causeUrl} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant="outline" size="icon">
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* QR code + actions */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Scan to visit your cause
            </p>
            <QRCodeGenerator text={causeUrl} size={200} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col justify-center gap-4 pt-6">
            <Button asChild size="lg" className="w-full">
              <Link href={`/p/${slug}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Your Cause
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/manage">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Social share */}
      <div className="mb-10">
        <ShareSection causeSlug={slug} causeTitle={title} />
      </div>

      {/* Tip */}
      <p className="text-center text-sm text-muted-foreground">
        Print the QR code on flyers, share the link on social media, or text it
        to your neighbors.
      </p>
    </main>
  );
}

export default function CreateSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Civilysta
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
