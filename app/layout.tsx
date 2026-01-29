import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { StructuredData } from "./components/StructuredData";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Nudge Webdesign - Websites die voor jou werken",
    template: "%s | Nudge Webdesign",
  },
  description: "Webdesign op maat tegen een eerlijke prijs. Websites die voor jou werken en meegroeien met je business. Moderne technologie voor Belgische KMO's.",
  keywords: ["website", "webshop", "webdesign", "Nudge Webdesign", "België", "KMO", "SEO", "online marketing", "Hasselt"],
  authors: [{ name: "Nudge Webdesign" }],
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yourwebsite.com",
    siteName: "Nudge Webdesign",
    title: "Nudge Webdesign - Websites die voor jou werken",
    description: "Webdesign op maat tegen een eerlijke prijs. Websites die voor jou werken en meegroeien met je business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nudge Webdesign - Websites die voor jou werken",
    description: "Webdesign op maat tegen een eerlijke prijs. Websites die voor jou werken en meegroeien met je business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
