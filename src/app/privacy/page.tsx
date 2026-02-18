import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Data Policy",
  description:
    "How Civilysta handles your data — what's public, what's private, and our commitments.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Civilysta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Privacy & Data Policy</h1>
        <p className="mb-10 text-muted-foreground">
          Civilysta is a public utility for civic engagement. Here&apos;s how we
          handle your data.
        </p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              What&apos;s Public
            </h2>
            <p>
              Cause pages are public by design. The entire point of a cause page
              is to be shared, linked, indexed, and discovered. Cause titles,
              descriptions, AI-generated content, hero images, supporter counts,
              and comments are all publicly accessible. This is intentional —
              civic organizing requires visibility.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              What&apos;s Private
            </h2>
            <p className="mb-3">
              Supporter email addresses are private. When someone supports a
              cause by entering their email, that address is visible only to the
              cause creator. Civilysta will never:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Sell supporter email addresses to any third party</li>
              <li>
                Share supporter lists with political campaigns, marketers, or
                commercial interests
              </li>
              <li>
                Use supporter emails for any purpose other than connecting them
                to the cause they signed up for
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              What We Don&apos;t Collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                No tracking cookies beyond what&apos;s required for
                authentication
              </li>
              <li>No behavioral analytics or user profiling</li>
              <li>
                No demographic data on supporters — we store email and optional
                name, nothing else
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Aggregate Data</h2>
            <p className="mb-3">
              Over time, Civilysta may publish anonymized, aggregate data about
              civic engagement trends — for example, what types of issues are
              most common or how cause engagement changes over time.
            </p>
            <p>
              This data will be fully anonymized, published openly, and never
              sold commercially. Aggregate data is a public good, not a revenue
              stream.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Open Source Guarantee
            </h2>
            <p>
              Civilysta&apos;s source code is licensed under AGPL-3.0. The code
              is always open and inspectable, anyone can self-host their own
              instance, and if the platform ever shuts down, cause creators will
              be given the opportunity to export their data before closure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Changes to This Policy
            </h2>
            <p>
              This policy may be updated as the platform grows. Material
              changes — especially anything affecting supporter email privacy —
              will be communicated clearly and in advance.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Back to Civilysta
          </Link>
        </div>
      </main>
    </div>
  );
}
