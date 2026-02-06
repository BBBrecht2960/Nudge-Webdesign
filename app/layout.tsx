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
    default: "Nudge - Digitale systemen op maat voor bedrijven",
    template: "%s | Nudge",
  },
  description: "Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt. Van analyse tot bouw en uitbreiding. Hasselt, België.",
  keywords: ["digitaal systeem", "bedrijfssystemen", "webapplicaties", "Nudge", "België", "KMO", "automatisering", "Hasselt", "op maat"],
  authors: [{ name: "Nudge" }],
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yourwebsite.com",
    siteName: "Nudge",
    title: "Nudge - Digitale systemen op maat voor bedrijven",
    description: "Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nudge - Digitale systemen op maat voor bedrijven",
    description: "Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt.",
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
