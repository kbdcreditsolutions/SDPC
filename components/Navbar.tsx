"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pb-2 pointer-events-none">
      <header 
        className={`w-full max-w-6xl transition-all duration-300 rounded-full pointer-events-auto ${
          scrolled ? 'glass-panel py-2 px-6' : 'bg-transparent py-2 px-2'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 leading-tight group">
            <div className="transform transition-transform group-hover:scale-105">
              <Logo size={40} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-teal-900 tracking-tight">
                Sridatri Physio Care
              </span>
              <span className="text-[10px] text-teal-700/80 font-medium tracking-widest uppercase">
                Healing from Core
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8 items-center">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="ml-2 px-5 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-full hover:bg-teal-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Book Appointment
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-teal-700 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-4 bg-white/95 backdrop-blur-xl border border-teal-100 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-700 hover:text-teal-700 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-2 px-4 py-3 bg-teal-700 text-white text-sm font-semibold rounded-xl text-center hover:bg-teal-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              Book Appointment
            </Link>
          </div>
        )}
      </header>
    </div>
  );
}
