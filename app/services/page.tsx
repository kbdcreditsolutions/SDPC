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
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Our Services</h1>
          <p className="text-cyan-100 text-lg">
            Comprehensive, evidence-based physiotherapy services — each designed
            to address specific conditions and restore your optimal function.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t py-12 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Not sure which service is right for you?
          </h2>
          <p className="text-gray-600">
            Book a consultation and our specialists will assess your condition
            and recommend the best treatment plan.
          </p>
          <Link
            href="/contact"
            className="px-8 py-3 bg-cyan-700 text-white font-semibold rounded-lg hover:bg-cyan-800 transition-colors"
          >
            Book Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
