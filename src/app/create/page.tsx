"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/lib/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LandingPageRenderer } from "~/components/landing/LandingPageRenderer";
import { createSupabaseBrowserClient } from "~/lib/auth/supabase-browser";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  Rocket,
  Loader2,
  Check,
  RefreshCw,
} from "lucide-react";

type Step = 1 | 2 | 3;

interface GeneratedContent {
  heroHeadline: string;
  heroSubheadline: string;
  bullets: string[];
  ctaText: string;
  aboutBody: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
}

export default function CreateCausePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1: User input
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: AI output
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<number>(0);

  // Step 3: Publishing
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Restore draft from localStorage (after magic link auth or page revisit)
  useEffect(() => {
    const saved = localStorage.getItem("civilysta_draft");
    if (!saved) return;

    const restoreDraft = async () => {
      try {
        const draft = JSON.parse(saved);
        if (!draft.title || !draft.content) return;

        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        setTitle(draft.title);
        setDescription(draft.description);
        setContent(draft.content);
        setImages(draft.images ?? []);
        setSelectedImage(draft.selectedImageIndex ?? 0);
        setPrimaryColor(draft.primaryColor ?? "#3b82f6");
        // If authenticated (returning from magic link), go to publish step
        // Otherwise go to review step so they can continue
        setStep(user ? 3 : 2);

        // Only clear draft if user is authenticated (about to publish)
        if (user) {
          localStorage.removeItem("civilysta_draft");
        }
      } catch {
        localStorage.removeItem("civilysta_draft");
      }
    };

    restoreDraft();
  }, []);

  // Auto-save draft to localStorage when content exists (debounced)
  useEffect(() => {
    if (!content || step < 2) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        "civilysta_draft",
        JSON.stringify({
          title,
          description,
          content,
          images,
          selectedImageIndex: selectedImage,
          primaryColor,
        }),
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description, content, images, selectedImage, primaryColor, step]);

  const generatePreview = trpc.cause.generatePreview.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      setImages(data.images);
      setStep(2);
    },
  });

  const createCause = trpc.cause.create.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem("civilysta_draft");
      router.push(`/create/success?slug=${data.slug}&title=${encodeURIComponent(title)}`);
    },
  });

  const handleGenerate = () => {
    if (!title.trim() || !description.trim()) return;
    generatePreview.mutate({ title, description });
  };

  const handlePublish = async () => {
    if (!content) return;

    // Check if user is authenticated
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAuthenticating(true);
      return;
    }

    createCause.mutate({
      title,
      description,
      heroHeadline: content.heroHeadline,
      heroSubheadline: content.heroSubheadline,
      heroBullets: content.bullets,
      ctaText: content.ctaText,
      selectedImageUrl: images[selectedImage]?.url,
      primaryColor,
    });
  };

  const handleMagicLink = async () => {
    if (!authEmail.trim()) return;

    setOtpPending(true);
    setOtpError("");

    // Save draft so it survives the redirect
    localStorage.setItem(
      "civilysta_draft",
      JSON.stringify({
        title,
        description,
        content,
        images,
        selectedImageIndex: selectedImage,
        primaryColor,
      }),
    );

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/create`,
      },
    });

    setOtpPending(false);
    if (error) {
      setOtpError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Civilysta
          </Link>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Step 1: Describe */}
        {step === 1 && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h1 className="mb-2 text-3xl font-bold">
                Describe Your Cause
              </h1>
              <p className="text-muted-foreground">
                Tell us what you&apos;re fighting for. AI will generate a complete
                micro-site for you.
              </p>
            </div>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label htmlFor="cause-title" className="mb-2 block text-sm font-medium">
                    Cause Title
                  </label>
                  <Input
                    id="cause-title"
                    placeholder='e.g., "Save Riverside Park from Development"'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {title.length}/200
                  </p>
                </div>
                <div>
                  <label htmlFor="cause-description" className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="cause-description"
                    placeholder="Describe your cause in 1-3 sentences. What's the problem? What do you want to change?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description.length}/2000
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={
                    !title.trim() ||
                    description.length < 10 ||
                    generatePreview.isPending
                  }
                  className="w-full"
                  size="lg"
                >
                  {generatePreview.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating your site...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate My Cause Site
                    </>
                  )}
                </Button>
                {generatePreview.error && (
                  <p className="text-center text-sm text-destructive">
                    {generatePreview.error.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && content && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    Preview your cause site
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generatePreview.isPending}
                >
                  {generatePreview.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Try different content
                    </>
                  )}
                </Button>
              </div>
              <Button onClick={() => setStep(3)}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Image selection */}
            {images.length > 0 && (
              <div>
                {images.every((img) => img.url.startsWith("data:")) ? (
                  <>
                    <h3 className="mb-1 text-lg font-medium">
                      Choose a placeholder color
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      These are placeholder backgrounds. You can upload a real hero image later from your dashboard.
                    </p>
                  </>
                ) : (
                  <h3 className="mb-3 text-lg font-medium">
                    Choose a hero image
                  </h3>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === i
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Option ${i + 1}`}
                        className="aspect-video w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="overflow-hidden rounded-lg border shadow-lg">
              <LandingPageRenderer
                config={{
                  title,
                  description,
                  primaryColor,
                  heroHeadline: content.heroHeadline,
                  heroSubheadline: content.heroSubheadline,
                  heroImage: images[selectedImage]?.url,
                  heroBullets: content.bullets,
                  ctaText: content.ctaText,
                  aboutBody: content.aboutBody,
                }}
                supporterCount={0}
              />
            </div>
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && content && (
          <div className="mx-auto max-w-2xl space-y-8">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to preview
            </Button>

            <div className="text-center">
              <Rocket className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-2xl font-bold">
                Ready to Publish
              </h2>
              <p className="text-muted-foreground">
                Customize and launch your cause site
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Customize</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-28 font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auth gate */}
            {isAuthenticating ? (
              <Card>
                <CardHeader>
                  <CardTitle>Sign in to publish</CardTitle>
                </CardHeader>
                <CardContent>
                  {magicLinkSent ? (
                    <div className="py-4 text-center">
                      <Check className="mx-auto mb-3 h-10 w-10 text-primary" />
                      <p className="font-medium">Check your email!</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We sent a magic link to {authEmail}. Click it to sign
                        in and publish your cause.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enter your email to receive a magic link. No password
                        needed.
                      </p>
                      <label htmlFor="auth-email" className="sr-only">
                        Email address
                      </label>
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="your@email.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                      />
                      <Button
                        onClick={handleMagicLink}
                        className="w-full"
                        disabled={!authEmail.trim() || otpPending}
                      >
                        {otpPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Magic Link"
                        )}
                      </Button>
                      {otpError && (
                        <p className="text-center text-sm text-destructive">
                          {otpError}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground text-center">
                        Your draft is saved. After clicking the link in your
                        email, you&apos;ll return here automatically.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={handlePublish}
                className="w-full"
                size="lg"
                disabled={createCause.isPending}
              >
                {createCause.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Publish Your Cause
                  </>
                )}
              </Button>
            )}

            {createCause.error && (
              <p className="text-center text-sm text-destructive">
                {createCause.error.message}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
