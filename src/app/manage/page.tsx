"use client";

import { trpc } from "~/lib/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import {
  Plus,
  Users,
  MessageSquare,
  ExternalLink,
  Loader2,
  BarChart3,
} from "lucide-react";

export default function ManagePage() {
  const { data, isLoading } = trpc.cause.listMine.useQuery({});
  const causes = data?.causes;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Civilysta
          </Link>
          <Button asChild>
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              New Cause
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Causes</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and monitor your civic cause sites
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : causes && causes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {causes.map((cause) => (
              <Card key={cause.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cause.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {cause.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        cause.status === "PUBLISHED"
                          ? "default"
                          : cause.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {cause.status.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {cause._count.supporters} supporters
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {cause._count.comments} comments
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/p/${cause.slug}`}>
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/manage/${cause.id}`}>
                        <BarChart3 className="mr-1 h-3.5 w-3.5" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-20 text-center">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No causes yet</h3>
              <p className="mb-6 text-muted-foreground">
                Create your first civic cause site in under 60 seconds
              </p>
              <Button asChild>
                <Link href="/create">Create Your First Cause</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
