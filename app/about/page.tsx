import type { Metadata } from "next";
import Link from "next/link";
import { Heart, FlaskConical, Leaf, UserCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Sridatri Physio Care — our story, our values, and our commitment to patient-first, evidence-based physiotherapy.",
};

const values = [
  {
    Icon: Heart,
    title: "Patient-First",
    desc: "Every decision we make is guided by what is best for the patient. We listen, we assess, and we create plans that truly serve your recovery.",
  },
  {
    Icon: FlaskConical,
    title: "Evidence-Based",
    desc: "Our treatments are grounded in the latest clinical research and physiotherapy best practices — not guesswork.",
  },
  {
    Icon: Leaf,
    title: "Holistic Approach",
    desc: "We treat the whole person, not just the injury. Physical, functional, and lifestyle factors are all part of your care plan.",
  },
];

const teamPlaceholders = [
  { name: "Dr. Tejaswini Damerla", role: "Consultant Physiotherapist — Sports Injury & Musculoskeletal" },
  { name: "Expert Team", role: "Rehabilitation Specialists" },
  { name: "Online & Offline", role: "Consultations Available" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 relative z-10">
          <h1 className="text-5xl font-display font-bold">About Sridatri Physio Care</h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Founded on the belief that true healing starts from within.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <h2 className="text-4xl font-display font-bold text-teal-900 text-center mb-4">Our Story</h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Sridatri Physio Care was founded with one mission — to help people
            heal from the core. We believe that effective physiotherapy goes
            beyond treating symptoms; it requires understanding the root cause of
            pain, dysfunction, and limitation.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            Our clinic was established to fill a gap in patient-centered care —
            where each individual receives the time, attention, and expertise
            they deserve. From chronic back pain sufferers to elite athletes
            recovering from injury, every patient walks through our doors with a
            unique story, and we honor that by building a unique plan.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            Today, Sridatri Physio Care is led by <strong>Dr. Tejaswini Damerla</strong>, Consultant Physiotherapist specializing in sports injury rehabilitation and musculoskeletal physiotherapy — focused on restoring strength, mobility, and pain-free living. We serve patients across Hyderabad with clinic visits, home physiotherapy, and online consultations.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center flex flex-col items-center gap-4 card-hover"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <v.Icon className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-display font-semibold text-teal-950">{v.title}</h3>
                <p className="text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">Meet Our Team</h2>
            <p className="text-slate-500 mt-4 text-lg">
              Experienced, compassionate, and dedicated to your recovery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {teamPlaceholders.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center gap-4 p-8 rounded-3xl border border-slate-100 bg-slate-50 card-hover"
              >
                <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-teal-700" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-display font-semibold text-teal-950 text-center">{m.name}</h3>
                <p className="text-sm font-medium text-teal-700 text-center">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Start Your Healing Journey Today</h2>
          <Link
            href="/contact"
            className="px-10 py-4 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300"
          >
            Book Appointment
          </Link>
        </div>
      </section>
    </>
  );
}
