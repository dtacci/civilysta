"use client";

import { useState } from "react";
import { QRCodeGenerator } from "~/components/qr/QRCodeGenerator";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";

interface ShareSectionProps {
  causeSlug: string;
  causeTitle: string;
}

export function ShareSection({ causeSlug, causeTitle }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
  const shareUrl = `${baseUrl}/p/${causeSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border p-8">
      <div className="mb-6 text-center">
        <Share2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="text-xl font-bold">Share This Cause</h3>
        <p className="mt-1 text-muted-foreground">
          Help spread the word about &ldquo;{causeTitle}&rdquo;
        </p>
      </div>

      {/* URL copy */}
      <div className="mb-6 flex gap-2">
        <Input value={shareUrl} readOnly className="font-mono text-sm" />
        <Button onClick={handleCopy} variant="outline" size="icon">
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Scan to visit this cause
        </p>
        <QRCodeGenerator text={shareUrl} size={200} />
      </div>
    </div>
  );
}
