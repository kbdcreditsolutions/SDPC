import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-2">Sridatri Physio Care</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Healing from Core — Evidence-based physiotherapy and wellness care
            designed around you.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/services", label: "Services" },
              { href: "/blog", label: "Blog" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-cyan-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Narayanguda, Hyderabad 500027</li>
            <li>📞 +91 81432 38246 / 82477 31436</li>
            <li>✉️ care@sridatriwellness.com</li>
            <li>🕐 All Days: 8am – 9pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} Sridatri Physio Care. All rights reserved.
      </div>
    </footer>
  );
}
