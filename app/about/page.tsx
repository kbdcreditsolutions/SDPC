import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Sridatri Physio Care — our story, our values, and our commitment to patient-first, evidence-based physiotherapy.",
};

const values = [
  {
    icon: "❤️",
    title: "Patient-First",
    desc: "Every decision we make is guided by what is best for the patient. We listen, we assess, and we create plans that truly serve your recovery.",
  },
  {
    icon: "🔬",
    title: "Evidence-Based",
    desc: "Our treatments are grounded in the latest clinical research and physiotherapy best practices — not guesswork.",
  },
  {
    icon: "🌱",
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
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold">About Sridatri Physio Care</h1>
          <p className="text-cyan-100 text-lg">
            Founded on the belief that true healing starts from within.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-slate-800">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            Sridatri Physio Care was founded with one mission — to help people
            heal from the core. We believe that effective physiotherapy goes
            beyond treating symptoms; it requires understanding the root cause of
            pain, dysfunction, and limitation.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our clinic was established to fill a gap in patient-centered care —
            where each individual receives the time, attention, and expertise
            they deserve. From chronic back pain sufferers to elite athletes
            recovering from injury, every patient walks through our doors with a
            unique story, and we honor that by building a unique plan.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, Sridatri Physio Care is led by <strong>Dr. Tejaswini Damerla</strong>, Consultant Physiotherapist specializing in sports injury rehabilitation and musculoskeletal physiotherapy — focused on restoring strength, mobility, and pain-free living. We serve patients across Hyderabad with clinic visits, home physiotherapy, and online consultations.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center flex flex-col items-center gap-3"
              >
                <div className="text-4xl">{v.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800">{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Meet Our Team</h2>
            <p className="text-gray-500 mt-2">
              Experienced, compassionate, and dedicated to your recovery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teamPlaceholders.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 bg-gray-50"
              >
                <div className="w-20 h-20 rounded-full bg-cyan-100 flex items-center justify-center text-3xl">
                  👤
                </div>
                <h3 className="font-semibold text-slate-800">{m.name}</h3>
                <p className="text-sm text-cyan-700">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cyan-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold">Start Your Healing Journey Today</h2>
          <Link
            href="/contact"
            className="px-8 py-3 bg-white text-cyan-800 font-semibold rounded-lg hover:bg-cyan-50 transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </section>
    </>
  );
}
