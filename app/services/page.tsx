import type { Metadata } from "next";
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore our full range of physiotherapy services including back & spine therapy, sports injury rehab, neurological rehabilitation, and more.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white pt-36 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 relative z-10">
          <h1 className="text-5xl font-display font-bold">Our Services</h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Comprehensive, evidence-based physiotherapy services — each designed
            to address specific conditions and restore your optimal function.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-100 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl font-display font-bold text-teal-950">
            Not sure which service is right for you?
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl">
            Book a consultation and our specialists will assess your condition
            and recommend the best treatment plan.
          </p>
          <Link
            href="/contact"
            className="px-10 py-4 mt-2 bg-teal-700 text-white font-semibold rounded-full hover:bg-teal-800 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            Book Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
