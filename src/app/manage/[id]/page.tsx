"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/lib/trpc/client";
import { createSupabaseBrowserClient } from "~/lib/auth/supabase-browser";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { QRCodeGenerator } from "~/components/qr/QRCodeGenerator";
import { LandingPageRenderer } from "~/components/landing/LandingPageRenderer";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Loader2,
  Users,
  MessageSquare,
  Download,
  Copy,
  Check,
  QrCode,
  Webhook,
  FileText,
  ImagePlus,
  X,
  Plus,
  Paintbrush,
  MapPin,
  Calendar,
  Mail,
  Send,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "content" | "customize" | "supporters" | "share" | "integrations";

const COLOR_THEMES = [
  { name: "Civic Blue", color: "#3b82f6" },
  { name: "Forest Green", color: "#16a34a" },
  { name: "Action Red", color: "#dc2626" },
  { name: "Warm Amber", color: "#d97706" },
  { name: "Deep Purple", color: "#7c3aed" },
  { name: "Slate", color: "#475569" },
] as const;

export default function ManageCausePage() {
  const params = useParams();
  const id = params.id as string;

  const utils = trpc.useUtils();

  const { data: cause, isLoading } = trpc.cause.getById.useQuery({ id });
  const { data: supporterData } = trpc.supporter.listByCause.useQuery(
    { causeId: id },
    { enabled: !!cause },
  );

  const [tab, setTab] = useState<Tab>("content");

  // Content tab state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [status, setStatus] = useState<string>("PUBLISHED");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Customize tab state
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroBullets, setHeroBullets] = useState<string[]>([]);
  const [ctaText, setCtaText] = useState("Support This Cause");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [isUploading, setIsUploading] = useState(false);
  const [hasDesignChanges, setHasDesignChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location + Event state (stored in LandingPage.config)
  const [location, setLocation] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventRecurrence, setEventRecurrence] = useState<
    "none" | "weekly" | "biweekly" | "monthly"
  >("none");
  const [eventEndDate, setEventEndDate] = useState("");

  // Email blast state
  const [blastSubject, setBlastSubject] = useState("");
  const [blastMessage, setBlastMessage] = useState("");

  // Prefill from cause data
  useEffect(() => {
    if (!cause) return;
    setTitle(cause.title);
    setSlug(cause.slug);
    setDescription(cause.description);
    setGoal(cause.goal ?? "");
    setUpdateMessage(cause.updateMessage ?? "");
    setWebhookUrl(cause.webhookUrl ?? "");
    setStatus(cause.status);

    const cfg = (cause.landingPage?.config ?? {}) as Record<string, unknown>;
    setHeroHeadline((cfg.heroHeadline as string) ?? cause.title);
    setHeroSubheadline((cfg.heroSubheadline as string) ?? cause.description);
    setHeroImage((cfg.heroImage as string) ?? cause.imageUrl ?? null);
    setHeroBullets((cfg.heroBullets as string[]) ?? []);
    setCtaText((cfg.ctaText as string) ?? "Support This Cause");
    setPrimaryColor((cfg.primaryColor as string) ?? "#3b82f6");
    setLocation((cfg.location as string) ?? "");
    const ev = cfg.event as
      | {
          title?: string;
          date: string;
          time?: string;
          recurrence: "none" | "weekly" | "biweekly" | "monthly";
          endDate?: string;
        }
      | undefined;
    if (ev) {
      setEventTitle(ev.title ?? "");
      setEventDate(ev.date ?? "");
      setEventTime(ev.time ?? "");
      setEventRecurrence(ev.recurrence ?? "none");
      setEventEndDate(ev.endDate ?? "");
    }
  }, [cause]);

  // Track content changes
  useEffect(() => {
    if (!cause) return;
    setHasChanges(
      title !== cause.title ||
        slug !== cause.slug ||
        description !== cause.description ||
        (goal || "") !== (cause.goal ?? "") ||
        (updateMessage || "") !== (cause.updateMessage ?? "") ||
        (webhookUrl || "") !== (cause.webhookUrl ?? "") ||
        status !== cause.status,
    );
  }, [title, slug, description, goal, updateMessage, webhookUrl, status, cause]);

  // Track design changes
  useEffect(() => {
    if (!cause) return;
    const cfg = (cause.landingPage?.config ?? {}) as Record<string, unknown>;
    setHasDesignChanges(
      heroHeadline !== ((cfg.heroHeadline as string) ?? cause.title) ||
        heroSubheadline !==
          ((cfg.heroSubheadline as string) ?? cause.description) ||
        heroImage !== ((cfg.heroImage as string) ?? cause.imageUrl ?? null) ||
        JSON.stringify(heroBullets) !==
          JSON.stringify((cfg.heroBullets as string[]) ?? []) ||
        ctaText !== ((cfg.ctaText as string) ?? "Support This Cause") ||
        primaryColor !== ((cfg.primaryColor as string) ?? "#3b82f6"),
    );
  }, [
    heroHeadline,
    heroSubheadline,
    heroImage,
    heroBullets,
    ctaText,
    primaryColor,
    cause,
  ]);

  const updateCause = trpc.cause.update.useMutation({
    onSuccess: () => {
      toast.success("Cause updated");
      setHasChanges(false);
      utils.cause.getById.invalidate({ id });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateLandingPage = trpc.cause.updateLandingPage.useMutation({
    onSuccess: () => {
      toast.success("Design saved");
      setHasDesignChanges(false);
      utils.cause.getById.invalidate({ id });
    },
    onError: (err) => toast.error(err.message),
  });

  const sendBlast = trpc.supporter.sendBlast.useMutation({
    onSuccess: (result) => {
      toast.success(`Email sent to ${result.sent} supporter${result.sent === 1 ? "" : "s"}`);
      setBlastSubject("");
      setBlastMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateCause.mutate({
      id,
      title,
      slug: slug !== cause?.slug ? slug : undefined,
      description,
      goal: goal || undefined,
      updateMessage: updateMessage || null,
      webhookUrl: webhookUrl || null,
      status: status as "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "ARCHIVED",
    });
  };

  const handleSaveDesign = () => {
    updateLandingPage.mutate({
      id,
      heroHeadline,
      heroSubheadline,
      heroImage,
      heroBullets,
      ctaText,
      primaryColor,
      location: location || null,
      event: eventDate
        ? {
            title: eventTitle || undefined,
            date: eventDate,
            time: eventTime || undefined,
            recurrence: eventRecurrence,
            endDate:
              eventRecurrence !== "none" && eventEndDate
                ? eventEndDate
                : undefined,
          }
        : null,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${id}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("cause-images")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("cause-images").getPublicUrl(path);

      setHeroImage(publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const causeUrl =
    typeof window !== "undefined" && cause
      ? `${window.location.origin}/p/${cause.slug}`
      : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(causeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const supporters = supporterData?.supporters;
    if (!supporters?.length) return;
    const rows = [
      "Name,Email,Joined",
      ...supporters.map(
        (s) =>
          `"${(s.name ?? "").replace(/"/g, '""')}","${s.email}","${new Date(s.createdAt).toLocaleDateString()}"`,
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supporters-${cause?.slug ?? id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePetition = () => {
    const supporters = supporterData?.supporters;
    if (!cause || !supporters?.length) return;
    const sigRows = supporters
      .map(
        (s, i) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i + 1}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">${s.name ?? "\u2014"}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">${new Date(s.createdAt).toLocaleDateString()}</td>
          </tr>`,
      )
      .join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Petition: ${cause.title}</title><style>@media print{body{margin:0.75in}}</style></head><body style="font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.6"><h1 style="font-size:28px;margin-bottom:4px">${cause.title}</h1><p style="color:#666;margin-top:0">Community Petition &mdash; ${new Date().toLocaleDateString()}</p><hr style="border:none;border-top:2px solid #1a1a1a;margin:24px 0"/><p style="font-size:15px">${cause.description}</p>${cause.goal ? `<p style="font-size:15px"><strong>Goal:</strong> ${cause.goal}</p>` : ""}<h2 style="font-size:20px;margin-top:32px;margin-bottom:12px">Supporters (${supporters.length})</h2><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f8f9fa"><th style="padding:8px 12px;text-align:center;border-bottom:2px solid #1a1a1a;width:40px">#</th><th style="padding:8px 12px;text-align:left;border-bottom:2px solid #1a1a1a">Name</th><th style="padding:8px 12px;text-align:left;border-bottom:2px solid #1a1a1a;width:120px">Date</th></tr></thead><tbody>${sigRows}</tbody></table><hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/><p style="font-size:12px;color:#888;text-align:center">Generated via Civilysta &mdash; ${causeUrl}</p></body></html>`);
    win.document.close();
    win.onload = () => win.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cause) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Cause not found</p>
        <Button asChild variant="outline">
          <Link href="/manage">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const supporters = supporterData?.supporters ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/manage">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="max-w-[300px] truncate text-lg font-bold">
              {cause.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/p/${cause.slug}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Live
              </Link>
            </Button>
            {tab === "content" && (
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!hasChanges || updateCause.isPending}
              >
                {updateCause.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            )}
            {tab === "customize" && (
              <Button
                onClick={handleSaveDesign}
                size="sm"
                disabled={!hasDesignChanges || updateLandingPage.isPending}
              >
                {updateLandingPage.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save Design
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Stats bar */}
        <div className="mb-6 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {cause._count.supporters}
            </span>
            supporters
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {cause._count.comments}
            </span>
            comments
          </div>
          <Badge
            variant={
              status === "PUBLISHED"
                ? "default"
                : status === "ARCHIVED"
                  ? "secondary"
                  : "outline"
            }
          >
            {status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b">
          {(
            [
              ["content", "Content"],
              ["customize", "Customize"],
              ["supporters", "Supporters"],
              ["share", "Share"],
              ["integrations", "Integrations"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ============ CONTENT TAB ============ */}
        {tab === "content" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Cause</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-title"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Title
                  </label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-slug"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    URL
                  </label>
                  <div className="flex items-center gap-0">
                    <span className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-xs text-muted-foreground">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/p/`
                        : "/p/"}
                    </span>
                    <Input
                      id="edit-slug"
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                            .replace(/--+/g, "-"),
                        )
                      }
                      maxLength={60}
                      className="rounded-l-none font-mono text-sm"
                    />
                  </div>
                  {slug && slug !== cause?.slug && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3
                        ? "Old links will automatically redirect to the new URL."
                        : "Only lowercase letters, numbers, and hyphens (min 3 chars)"}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-description"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Description
                  </label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-goal"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Goal
                  </label>
                  <Input
                    id="edit-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Stop the rezoning vote"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-location"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </span>
                  </label>
                  <Input
                    id="edit-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., City Hall, 123 Main St, Sacramento CA"
                    maxLength={300}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    A map will appear on your public page
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="edit-update"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Campaign Update
                  </label>
                  <Textarea
                    id="edit-update"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder='Post an update (e.g., "We won the first vote!")'
                    rows={2}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Displays as a banner on your cause page
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="event-title"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Event Name
                  </label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder={cause.title}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Defaults to your cause title if blank
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="event-date"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Date
                    </label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="event-time"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Time
                    </label>
                    <Input
                      id="event-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="event-recurrence"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Repeats
                    </label>
                    <select
                      id="event-recurrence"
                      value={eventRecurrence}
                      onChange={(e) =>
                        setEventRecurrence(
                          e.target.value as
                            | "none"
                            | "weekly"
                            | "biweekly"
                            | "monthly",
                        )
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  {eventRecurrence !== "none" && (
                    <div>
                      <label
                        htmlFor="event-end-date"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Until
                      </label>
                      <Input
                        id="event-end-date"
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {!eventDate && (
                  <p className="text-xs text-muted-foreground">
                    Add a date to show an event card with calendar integration on
                    your page
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(["PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        status === s
                          ? s === "PUBLISHED"
                            ? "bg-primary text-primary-foreground"
                            : s === "ARCHIVED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s === "PUBLISHED"
                        ? "Published"
                        : s === "DRAFT"
                          ? "Draft"
                          : "Archived"}
                    </button>
                  ))}
                </div>
                {(status === "ARCHIVED" || status === "DRAFT") && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Not visible to the public
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ CUSTOMIZE TAB ============ */}
        {tab === "customize" && (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              {/* Hero Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Hero Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    {heroImage ? (
                      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border">
                        <img
                          src={heroImage}
                          alt="Hero"
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => setHeroImage(null)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                        <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {heroImage ? "Change Photo" : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Your own photo will always beat AI-generated imagery
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Headline & Subheadline */}
              <Card>
                <CardHeader>
                  <CardTitle>Headline & Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label
                      htmlFor="hero-headline"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Headline
                    </label>
                    <Input
                      id="hero-headline"
                      value={heroHeadline}
                      onChange={(e) => setHeroHeadline(e.target.value)}
                      maxLength={200}
                      placeholder="The big, bold statement"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hero-sub"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Subheadline
                    </label>
                    <Textarea
                      id="hero-sub"
                      value={heroSubheadline}
                      onChange={(e) => setHeroSubheadline(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="A supporting sentence or two"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Key Points / Bullets */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {heroBullets.map((bullet, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...heroBullets];
                          updated[i] = e.target.value;
                          setHeroBullets(updated);
                        }}
                        maxLength={200}
                        placeholder={`Point ${i + 1}`}
                      />
                      <button
                        onClick={() =>
                          setHeroBullets(heroBullets.filter((_, j) => j !== i))
                        }
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {heroBullets.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHeroBullets([...heroBullets, ""])}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Point
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* CTA Text */}
              <Card>
                <CardHeader>
                  <CardTitle>Call-to-Action Button</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    maxLength={50}
                    placeholder='e.g., "Sign the Petition"'
                  />
                </CardContent>
              </Card>

              {/* Color Theme */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="h-4 w-4" />
                    Color Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_THEMES.map((theme) => (
                      <button
                        key={theme.color}
                        onClick={() => setPrimaryColor(theme.color)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`h-10 w-10 rounded-full transition-all ${
                            primaryColor === theme.color
                              ? "ring-2 ring-offset-2 ring-offset-background"
                              : "hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: theme.color,
                            outlineColor:
                              primaryColor === theme.color
                                ? theme.color
                                : undefined,
                            // @ts-expect-error -- CSS custom property for Tailwind ring
                            "--tw-ring-color":
                              primaryColor === theme.color
                                ? theme.color
                                : undefined,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-20">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Live Preview
                </p>
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ height: 400 }}
                >
                  <div
                    style={{
                      transform: "scale(0.36)",
                      transformOrigin: "top left",
                      width: "278%",
                      height: "278%",
                      pointerEvents: "none",
                    }}
                  >
                    <LandingPageRenderer
                      config={{
                        heroHeadline,
                        heroSubheadline,
                        heroImage: heroImage ?? undefined,
                        heroBullets,
                        ctaText,
                        primaryColor,
                        description: cause.description,
                      }}
                      supporterCount={cause._count.supporters}
                    />
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Updates as you type
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============ SUPPORTERS TAB ============ */}
        {tab === "supporters" && (
          <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Supporters ({cause._count.supporters})</CardTitle>
              {supporters.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleGeneratePetition}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Petition
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    CSV
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {supporters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Name</th>
                        <th className="pb-2 pr-4 font-medium">Email</th>
                        <th className="pb-2 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supporters.map((s, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            {s.name || "Anonymous"}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            {s.email}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No supporters yet. Share your cause to start building support!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Email Blast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Your Supporters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="blast-subject"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Subject
                </label>
                <Input
                  id="blast-subject"
                  value={blastSubject}
                  onChange={(e) => setBlastSubject(e.target.value)}
                  placeholder={`Update from ${cause.title}`}
                  maxLength={200}
                />
              </div>
              <div>
                <label
                  htmlFor="blast-message"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Message
                </label>
                <Textarea
                  id="blast-message"
                  value={blastMessage}
                  onChange={(e) => setBlastMessage(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder="Write your message to supporters..."
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Includes an unsubscribe link in every email
                </p>
                <Button
                  onClick={() =>
                    sendBlast.mutate({
                      causeId: id,
                      subject: blastSubject,
                      message: blastMessage,
                    })
                  }
                  disabled={
                    !blastSubject.trim() ||
                    !blastMessage.trim() ||
                    sendBlast.isPending ||
                    supporters.length === 0
                  }
                  size="sm"
                >
                  {sendBlast.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Send to {cause._count.supporters} supporter
                  {cause._count.supporters === 1 ? "" : "s"}
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* ============ SHARE TAB ============ */}
        {tab === "share" && (
          <div className="mx-auto max-w-md space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Share Your Cause
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={causeUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <QRCodeGenerator text={causeUrl} size={200} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ INTEGRATIONS TAB ============ */}
        {tab === "integrations" && (
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll POST JSON here whenever someone supports your
                  cause. Works with Zapier, Make, n8n, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
