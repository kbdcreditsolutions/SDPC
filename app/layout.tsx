import type { Metadata } from "next";
import { Figtree, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
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
    <html lang="en" className={`${figtree.variable} ${lora.variable} ${plexMono.variable}`}>
      <body className="font-sans bg-[#FAF9F6] text-slate-800 antialiased selection:bg-teal-200 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
