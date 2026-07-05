import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-800">
        <div>
          <h3 className="text-white font-display font-bold text-xl mb-3">Sridatri Physio Care</h3>
          <p className="text-sm text-slate-400 leading-relaxed pr-6">
            Healing from Core — Evidence-based physiotherapy and wellness care
            designed around you.
          </p>
        </div>

        <div>
          <h4 className="text-white font-display font-semibold text-lg mb-4">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/services", label: "Services" },
              { href: "/blog", label: "Blog" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-teal-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-display font-semibold text-lg mb-4">Contact Us</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <span>Narayanguda, Hyderabad 500027</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-teal-500 flex-shrink-0" strokeWidth={1.5} />
              <span>+91 81432 38246 / 82477 31436</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-500 flex-shrink-0" strokeWidth={1.5} />
              <span>care@sridatriwellness.com</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-500 flex-shrink-0" strokeWidth={1.5} />
              <span>All Days: 8am – 9pm</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 text-center py-6 text-xs text-slate-500">
        © {new Date().getFullYear()} Sridatri Physio Care. All rights reserved.
      </div>
    </footer>
  );
}
