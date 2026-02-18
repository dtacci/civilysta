"use client";

import { useState } from "react";
import { QRCodeGenerator } from "~/components/qr/QRCodeGenerator";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";

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

  const shareText = `${causeTitle} — ${shareUrl}`;
  const canNativeShare =
    typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: causeTitle, url: shareUrl });
    } catch {
      // User cancelled or not supported
    }
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

      {/* Social share buttons */}
      <div className="mb-6 flex flex-wrap justify-center gap-3">
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(causeTitle)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Post
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Share
        </a>
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
