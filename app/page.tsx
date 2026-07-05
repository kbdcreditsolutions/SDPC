import type { Metadata } from "next";
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import BlogCard from "@/components/BlogCard";
import { services, blogPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sridatri Physio Care – Healing from Core",
  description:
    "Expert physiotherapy and wellness care. Book your appointment today and start healing from the core.",
};

export default function HomePage() {
  const latestPosts = blogPosts.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-cyan-200">
            Physiotherapy &amp; Wellness Clinic
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Healing from Core
          </h1>
          <p className="text-lg md:text-xl text-cyan-100 max-w-2xl">
            Personalized, evidence-based physiotherapy care that targets the root
            cause — not just the symptoms. Restore movement, relieve pain, and
            reclaim your life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/contact"
              className="px-8 py-3 bg-white text-cyan-800 font-semibold rounded-lg hover:bg-cyan-50 transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/services"
              className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Our Services
            </Link>
          </div>
          <p className="text-cyan-200 text-sm mt-2">
            Online &amp; Offline consultations available · Home Physiotherapy · Mon–Sun 9am–9pm
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Our Services</h2>
            <p className="text-gray-500 mt-2">
              Comprehensive care tailored to your unique recovery needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/services"
              className="inline-block px-6 py-2 border border-cyan-700 text-cyan-700 rounded-lg font-medium hover:bg-cyan-50 transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Conditions We Treat */}
      <section className="bg-cyan-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Conditions We Treat</h2>
            <p className="text-gray-500 mt-2">Expert care for a wide range of pain and mobility conditions.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Neck & Back Pain","Shoulder Pain","Knee Pain","Sports Injuries",
              "Post-Surgery Rehab","Sciatica","Joint & Muscle Pain",
              "Elderly Care","Neurological Rehab","Posture Correction",
            ].map((c) => (
              <span key={c} className="px-4 py-2 bg-white border border-cyan-200 rounded-full text-sm font-medium text-cyan-800 shadow-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Why Choose Us</h2>
            <p className="text-gray-500 mt-2">
              Trusted by hundreds of patients for lasting results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "👨‍⚕️",
                title: "Expert Team",
                desc: "Our certified physiotherapists bring years of clinical experience and ongoing specialist training to every session.",
              },
              {
                icon: "🎯",
                title: "Personalized Care",
                desc: "No two patients are the same. We design individual treatment plans based on thorough assessment and your specific goals.",
              },
              {
                icon: "🏥",
                title: "Modern Equipment",
                desc: "State-of-the-art therapeutic tools including ultrasound, electrotherapy, and advanced rehabilitation equipment.",
              },
            ].map((p) => (
              <div key={p.title} className="text-center flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100">
                <div className="text-4xl">{p.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800">Latest from Our Blog</h2>
            <p className="text-gray-500 mt-2">
              Expert insights on recovery, rehabilitation, and wellness.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((p) => (
              <BlogCard key={p.id} {...p} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/blog"
              className="inline-block px-6 py-2 border border-cyan-700 text-cyan-700 rounded-lg font-medium hover:bg-cyan-50 transition-colors"
            >
              Read All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-cyan-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <h2 className="text-3xl font-bold">Ready to Start Your Recovery?</h2>
          <p className="text-cyan-100">
            Take the first step toward pain-free living. Our expert team is here
            to guide you every step of the way.
          </p>
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
