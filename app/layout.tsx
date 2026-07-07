import type { Metadata } from "next";
import { Figtree, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
});

export const metadata: Metadata = {
  title: {
    default: "Sridatri Physio Care – Healing from Core",
    template: "%s | Sridatri Physio Care",
  },
  description:
    "Expert physiotherapy and wellness care in Hyderabad. Back & spine therapy, sports injury rehab, neurological rehabilitation, and more — healing from the core.",
  keywords: [
    "physiotherapy",
    "physio care",
    "back pain",
    "sports injury",
    "rehabilitation",
    "Hyderabad",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${figtree.variable} ${outfit.variable} ${plexMono.variable}`}>
      <body className="font-sans bg-[#F8FAFC] text-slate-800 antialiased selection:bg-teal-200 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
