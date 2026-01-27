import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PostHogProviderWrapper } from "@/lib/posthog";
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
    default: "Almost 3000 BV - Websites die écht werken",
    template: "%s | Almost 3000 BV",
  },
  description: "Wij bouwen moderne websites en webshops die leads genereren voor Belgische KMO's. Geen verouderde WordPress-sites, maar slimme oplossingen met onderhoud inbegrepen.",
  keywords: ["website", "webshop", "webdesign", "Almost 3000 BV", "België", "KMO", "SEO", "online marketing", "Hasselt"],
  authors: [{ name: "Almost 3000 BV" }],
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yourwebsite.com",
    siteName: "Almost 3000 BV",
    title: "Almost 3000 BV - Websites die écht werken",
    description: "Wij bouwen moderne websites en webshops die leads genereren voor Belgische KMO's.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Almost 3000 BV - Websites die écht werken",
    description: "Wij bouwen moderne websites en webshops die leads genereren voor Belgische KMO's.",
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
        <PostHogProviderWrapper>
        {children}
        </PostHogProviderWrapper>
      </body>
    </html>
  );
}
