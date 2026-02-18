"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Heart, Check, Share2 } from "lucide-react";

interface SupporterFormProps {
  causeId: string;
  causeTitle: string;
  onSupported?: () => void;
}

export function SupporterForm({
  causeId,
  causeTitle,
  onSupported,
}: SupporterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [alreadySupported, setAlreadySupported] = useState(false);

  const support = trpc.supporter.support.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onSupported?.();
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setAlreadySupported(true);
      }
    },
  });

  if (alreadySupported) {
    return (
      <div className="rounded-lg border bg-primary/5 p-8 text-center">
        <Check className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-xl font-bold">You already support this cause!</h3>
        <p className="mb-4 text-muted-foreground">
          Thank you for standing with &ldquo;{causeTitle}&rdquo;.
        </p>
        <a
          href="#share"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Share2 className="h-4 w-4" />
          Help spread the word
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-primary/5 p-8 text-center">
        <Check className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-xl font-bold">Thank you for your support!</h3>
        <p className="mb-4 text-muted-foreground">
          You&apos;re now part of the movement for &ldquo;{causeTitle}&rdquo;.
        </p>
        <a
          href="#share"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Share2 className="h-4 w-4" />
          Help spread the word
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-8">
      <div className="mb-6 text-center">
        <Heart className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="text-xl font-bold">Support This Cause</h3>
        <p className="mt-1 text-muted-foreground">
          Add your name to show your support
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !email.trim()) return;
          support.mutate({ causeId, email, name });
        }}
        className="space-y-4"
      >
        <Input
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          className="w-full"
          disabled={!name.trim() || !email.trim() || support.isPending}
        >
          {support.isPending ? "Adding your support..." : "Support This Cause"}
        </Button>
        {support.error && (
          <p className="text-center text-sm text-destructive">
            {support.error.message}
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Your first name and last initial will appear publicly. Your email
          is only shared with the cause organizer.
        </p>
      </form>
    </div>
  );
}
