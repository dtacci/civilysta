import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import { TRPCProvider } from "~/lib/trpc/provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Civilysta — Create Your Civic Cause",
    template: "%s | Civilysta",
  },
  description:
    "Describe a cause. Get a live micro-site with AI-generated imagery, a petition, discussion thread, and QR code — in under 60 seconds.",
  keywords: ["civic engagement", "petition", "community", "cause", "activism"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <Toaster position="bottom-right" />
        </TRPCProvider>
      </body>
    </html>
  );
}
