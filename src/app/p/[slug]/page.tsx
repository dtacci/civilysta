import { notFound, redirect } from "next/navigation";
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
    // Check for a slug redirect (old slug → new slug)
    const slugRedirect = await db.slugRedirect.findUnique({
      where: { oldSlug: slug },
    });
    if (slugRedirect) {
      redirect(`/p/${slugRedirect.newSlug}`);
    }
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
    where: { slug, status: "PUBLISHED" },
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
  // Only use HTTPS image URLs in OG metadata — data: URIs are ignored by social crawlers
  const ogImage = cause.imageUrl?.startsWith("https://") ? cause.imageUrl : null;

  return {
    title: cause.title,
    description: cause.description,
    openGraph: {
      title: cause.title,
      description: cause.description,
      images: ogImage ? [ogImage] : [],
      url: `${siteUrl}/p/${slug}`,
      type: "website",
      siteName: "Civilysta",
    },
    twitter: {
      card: "summary_large_image",
      title: cause.title,
      description: cause.description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `${siteUrl}/p/${slug}`,
    },
  };
}
