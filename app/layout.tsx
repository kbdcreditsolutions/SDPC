import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-slate-800`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
