import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Modern Sans
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "My Last Act Of 26",
  description: "To fold is to breathe.",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
