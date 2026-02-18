"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/lib/trpc/client";
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
} from "lucide-react";
import { toast } from "sonner";

export default function ManageCausePage() {
  const params = useParams();
  const id = params.id as string;

  const utils = trpc.useUtils();

  const { data: cause, isLoading } = trpc.cause.getById.useQuery({ id });
  const { data: supporterData } = trpc.supporter.listByCause.useQuery(
    { causeId: id },
    { enabled: !!cause },
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [status, setStatus] = useState<string>("PUBLISHED");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (cause) {
      setTitle(cause.title);
      setDescription(cause.description);
      setGoal(cause.goal ?? "");
      setUpdateMessage(cause.updateMessage ?? "");
      setWebhookUrl(cause.webhookUrl ?? "");
      setStatus(cause.status);
    }
  }, [cause]);

  useEffect(() => {
    if (!cause) return;
    const changed =
      title !== cause.title ||
      description !== cause.description ||
      (goal || "") !== (cause.goal ?? "") ||
      (updateMessage || "") !== (cause.updateMessage ?? "") ||
      (webhookUrl || "") !== (cause.webhookUrl ?? "") ||
      status !== cause.status;
    setHasChanges(changed);
  }, [title, description, goal, updateMessage, webhookUrl, status, cause]);

  const updateCause = trpc.cause.update.useMutation({
    onSuccess: () => {
      toast.success("Cause updated");
      setHasChanges(false);
      utils.cause.getById.invalidate({ id });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSave = () => {
    updateCause.mutate({
      id,
      title,
      description,
      goal: goal || undefined,
      updateMessage: updateMessage || null,
      webhookUrl: webhookUrl || null,
      status: status as "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "ARCHIVED",
    });
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
    if (!supporterData?.supporters.length) return;
    const rows = [
      "Name,Email,Joined",
      ...supporterData.supporters.map(
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
    if (!cause || !supporterData?.supporters.length) return;
    const sigRows = supporterData.supporters
      .map(
        (s, i) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i + 1}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">${s.name ?? "—"}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">${new Date(s.createdAt).toLocaleDateString()}</td>
          </tr>`,
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Petition: ${cause.title}</title>
          <style>
            @media print { body { margin: 0.75in; } }
          </style>
        </head>
        <body style="font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.6">
          <h1 style="font-size:28px;margin-bottom:4px">${cause.title}</h1>
          <p style="color:#666;margin-top:0">Community Petition &mdash; ${new Date().toLocaleDateString()}</p>
          <hr style="border:none;border-top:2px solid #1a1a1a;margin:24px 0" />

          <p style="font-size:15px">${cause.description}</p>
          ${cause.goal ? `<p style="font-size:15px"><strong>Goal:</strong> ${cause.goal}</p>` : ""}

          <h2 style="font-size:20px;margin-top:32px;margin-bottom:12px">
            Supporters (${supporterData.supporters.length})
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f8f9fa">
                <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #1a1a1a;width:40px">#</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #1a1a1a">Name</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #1a1a1a;width:120px">Date</th>
              </tr>
            </thead>
            <tbody>${sigRows}</tbody>
          </table>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0" />
          <p style="font-size:12px;color:#888;text-align:center">
            Generated via Civilysta &mdash; ${causeUrl}
          </p>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => {
      win.print();
    };
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
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/manage">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold truncate max-w-[300px]">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Stats bar */}
        <div className="mb-8 flex items-center gap-6">
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Edit form */}
          <div className="space-y-6 lg:col-span-2">
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
                    htmlFor="edit-update"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Campaign Update
                  </label>
                  <Textarea
                    id="edit-update"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder='Post an update for supporters (e.g., "We won the first vote!")'
                    rows={2}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This will display as a banner on your cause page
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status control */}
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
                {status === "ARCHIVED" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Archived causes are not visible to the public
                  </p>
                )}
                {status === "DRAFT" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Draft causes are not visible to the public
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Supporters table */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>
                  Supporters ({cause._count.supporters})
                </CardTitle>
                {supporters.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={handleGeneratePetition} variant="outline" size="sm">
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Petition
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" size="sm">
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
                    No supporters yet. Share your cause to start building
                    support!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Share & QR */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Share
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
        </div>
      </main>
    </div>
  );
}
