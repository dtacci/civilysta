"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "~/lib/trpc/client";
import { LandingPageRenderer } from "~/components/landing/LandingPageRenderer";
import { CommentSection } from "~/components/comments/CommentSection";
import { SupporterForm } from "~/components/supporter/SupporterForm";
import { ShareSection } from "~/components/share/ShareSection";
import { Users } from "lucide-react";

interface CausePageClientProps {
  cause: {
    id: string;
    slug: string;
    title: string;
    description: string;
    goal: string | null;
    imageUrl: string | null;
    supporterCount: number;
    updateMessage: string | null;
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

      {cause.updateMessage && (
        <div className="border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm">
          <strong>Update from the organizer:</strong> {cause.updateMessage}
        </div>
      )}

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

      {/* Public supporter names */}
      <SupporterNames causeId={cause.id} totalCount={supporterCount} />

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

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <Link
          href="/"
          className="transition-colors hover:text-foreground"
        >
          Powered by Civilysta
        </Link>
        {" · "}
        <Link
          href="/privacy"
          className="transition-colors hover:text-foreground"
        >
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}

function SupporterNames({
  causeId,
  totalCount,
}: {
  causeId: string;
  totalCount: number;
}) {
  const { data } = trpc.supporter.getRecentNames.useQuery({ causeId });

  if (!data?.names.length || totalCount === 0) return null;

  const names = data.names;
  const remaining = totalCount - names.length;

  let text: string;
  if (names.length === 1 && remaining <= 0) {
    text = `${names[0]} supports this cause`;
  } else if (remaining <= 0) {
    text = `${names.join(", ")} support this cause`;
  } else {
    text = `${names.join(", ")}, and ${remaining.toLocaleString()} other${remaining === 1 ? "" : "s"} support this cause`;
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Users className="h-4 w-4 shrink-0" />
        <p>{text}</p>
      </div>
    </section>
  );
}
