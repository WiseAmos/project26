import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Modern Sans
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { Providers } from "@/components/Providers";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

export const metadata: Metadata = {
  title: "My Last Act Of 26",
  description: "Fold a digital paper crane. Release your unspoken words. A collective monument to the things we never said.",
  keywords: ["digital memorial", "paper cranes", "origami", "emotional health", "grief", "closure", "interactive art", "webgl"],
  authors: [{ name: "My Last Act Of 26" }],
  openGraph: {
    title: "My Last Act Of 26",
    description: "To fold is to breathe. Join the flock.",
    url: "https://mylastactof26.vercel.app",
    siteName: "My Last Act Of 26",
    images: [
      {
        url: "/icon.png",
        width: 1024,
        height: 1024,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Last Act Of 26",
    description: "Fold a digital paper crane. Release your unspoken words.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
