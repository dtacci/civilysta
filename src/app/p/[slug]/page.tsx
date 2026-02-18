import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "~/server/db";
import { CausePageClient } from "./client";

export const revalidate = 300; // ISR: regenerate at most every 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CausePage({ params }: PageProps) {
  const { slug } = await params;

  const cause = await db.cause.findUnique({
    where: { slug },
    include: {
      images: true,
      creator: { select: { id: true, name: true, avatarUrl: true } },
      landingPage: true,
      _count: { select: { supporters: true, comments: true } },
    },
  });

  if (!cause || cause.status !== "PUBLISHED") {
    notFound();
  }

  const config = (cause.landingPage?.config ?? {}) as Record<string, unknown>;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/p/${slug}`,
    name: cause.title,
    description: cause.description,
    url: `${siteUrl}/p/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Civilysta",
      url: siteUrl,
    },
    datePublished: cause.createdAt.toISOString(),
    dateModified: cause.updatedAt.toISOString(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CausePageClient
        cause={{
          id: cause.id,
          slug: cause.slug,
          title: cause.title,
          description: cause.description,
          goal: cause.goal,
          imageUrl: cause.imageUrl,
          supporterCount: cause.supporterCount,
          updateMessage: cause.updateMessage,
          createdAt: cause.createdAt.toISOString(),
          creator: cause.creator,
          commentCount: cause._count.comments,
        }}
        landingConfig={config}
      />
    </>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const cause = await db.cause.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      imageUrl: true,
    },
  });

  if (!cause) {
    return { title: "Cause Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";

  return {
    title: cause.title,
    description: cause.description,
    openGraph: {
      title: cause.title,
      description: cause.description,
      images: cause.imageUrl ? [cause.imageUrl] : [],
      url: `${siteUrl}/p/${slug}`,
      type: "website",
      siteName: "Civilysta",
    },
    twitter: {
      card: "summary_large_image",
      title: cause.title,
      description: cause.description,
      images: cause.imageUrl ? [cause.imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/p/${slug}`,
    },
  };
}
