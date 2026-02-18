"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingPageRenderer } from "~/components/landing/LandingPageRenderer";
import { CommentSection } from "~/components/comments/CommentSection";
import { SupporterForm } from "~/components/supporter/SupporterForm";
import { ShareSection } from "~/components/share/ShareSection";

interface CausePageClientProps {
  cause: {
    id: string;
    slug: string;
    title: string;
    description: string;
    goal: string | null;
    imageUrl: string | null;
    supporterCount: number;
    createdAt: string;
    creator: { id: string; name: string | null; avatarUrl: string | null };
    commentCount: number;
  };
  landingConfig: Record<string, unknown>;
}

export function CausePageClient({ cause, landingConfig }: CausePageClientProps) {
  const [supporterCount, setSupporterCount] = useState(cause.supporterCount);

  return (
    <div>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-primary">
            Civilysta
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Create Your Own Cause
          </Link>
        </div>
      </header>

      <LandingPageRenderer
        config={landingConfig}
        supporterCount={supporterCount}
        causeSlug={cause.slug}
      />

      {/* Support section */}
      <section id="support" className="bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <SupporterForm
            causeId={cause.id}
            causeTitle={cause.title}
            onSupported={() => setSupporterCount((c) => c + 1)}
          />
        </div>
      </section>

      {/* Share section */}
      <section id="share" className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <ShareSection causeSlug={cause.slug} causeTitle={cause.title} />
        </div>
      </section>

      {/* Comments section */}
      <section className="border-t px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold">
            Discussion ({cause.commentCount})
          </h2>
          <CommentSection causeId={cause.id} />
        </div>
      </section>
    </div>
  );
}
