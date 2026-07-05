import type { Metadata } from "next";
import Link from "next/link";
import { Users, Target, Activity } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import BlogCard from "@/components/BlogCard";
import { services, blogPosts, reviews } from "@/lib/data";

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
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-cyan-100">
            ⚕ Physiotherapy &amp; Wellness · Narayanguda, Hyderabad
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

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4 text-cyan-100 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-300">★</span> 5.0 Google Rating
            </span>
            <span className="hidden sm:inline text-cyan-500">·</span>
            <span>42+ Reviews</span>
            <span className="hidden sm:inline text-cyan-500">·</span>
            <span>2 Locations</span>
            <span className="hidden sm:inline text-cyan-500">·</span>
            <span>8+ Years Experience</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#134E4A]">Our Services</h2>
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
            <h2 className="text-3xl font-bold text-[#134E4A]">Conditions We Treat</h2>
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
            <h2 className="text-3xl font-bold text-[#134E4A]">Why Choose Us</h2>
            <p className="text-gray-500 mt-2">
              Trusted by hundreds of patients for lasting results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: Users,
                title: "Expert Team",
                desc: "Our certified physiotherapists bring years of clinical experience and ongoing specialist training to every session.",
              },
              {
                Icon: Target,
                title: "Personalized Care",
                desc: "No two patients are the same. We design individual treatment plans based on thorough assessment and your specific goals.",
              },
              {
                Icon: Activity,
                title: "Modern Equipment",
                desc: "State-of-the-art therapeutic tools including ultrasound, electrotherapy, and advanced rehabilitation equipment.",
              },
            ].map((p) => (
              <div key={p.title} className="text-center flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <p.Icon className="w-7 h-7 text-cyan-700" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-[#134E4A]">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#134E4A]">What Our Patients Say</h2>
            <p className="text-gray-500 mt-2">5.0 ★ · 42 Google reviews</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-[#134E4A]">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#134E4A]">Latest from Our Blog</h2>
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
