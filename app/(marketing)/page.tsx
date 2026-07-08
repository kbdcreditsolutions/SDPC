import type { Metadata } from "next";
import Link from "next/link";
import { Users, Target, Activity, Award, Clock, MapPin } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import BlogCard from "@/components/BlogCard";
import { services, blogPosts, reviews, team } from "@/lib/data";

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
      <section className="bg-transparent pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Text Content */}
            <div className="flex flex-col items-start text-left gap-8 relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold uppercase tracking-widest text-teal-700 shadow-sm animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Physiotherapy · Neuro Rehab · Paediatric
              </span>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] text-teal-950 tracking-tight">
                Healing from the <span className="text-teal-700 italic font-medium">Core</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Personalized, evidence-based physiotherapy care that targets the root
                cause — not just the symptoms. Restore movement, relieve pain, and
                reclaim your life.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-teal-800 text-white font-semibold rounded-full hover:bg-teal-900 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/20 hover:-translate-y-1 text-center"
                >
                  Book Appointment
                </Link>
                <Link
                  href="/services"
                  className="px-8 py-4 bg-white border-2 border-teal-100 text-teal-800 font-semibold rounded-full hover:bg-teal-50 hover:border-teal-200 transition-all duration-300 text-center"
                >
                  Our Services
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-6 border-t border-slate-200/60 text-slate-600 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-lg">★</span> 5.0 Google Rating
                </span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span>16+ Years Experience</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span>2 Locations in Hyd</span>
              </div>
            </div>

            {/* Image Content (Organic Arch) */}
            <div className="relative lg:ml-auto w-full max-w-lg lg:max-w-none mx-auto">
              <div className="relative aspect-[4/5] w-full rounded-t-[80px] md:rounded-t-[140px] rounded-b-[30px] md:rounded-b-[40px] overflow-hidden shadow-2xl shadow-teal-900/10 border-4 md:border-8 border-white">
                <img 
                  src="/hero-custom.png" 
                  alt="Physiotherapy session" 
                  className="w-full h-full object-cover object-center"
                />
                {/* Subtle gradient overlay to make image feel softer */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent"></div>
              </div>
              
              {/* Floating decorative element */}
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Recovery</p>
                  <p className="text-teal-950 font-semibold">Evidence Based</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">Our Services</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-lg">
              Comprehensive care tailored to your unique recovery needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-block px-8 py-3 bg-white border border-teal-200 text-teal-800 rounded-full font-semibold hover:bg-teal-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Conditions We Treat */}
      <section className="bg-teal-50 py-24 px-4 border-y border-teal-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-teal-900">Conditions We Treat</h2>
            <p className="text-teal-700/70 mt-4 text-lg">Expert care for a wide range of pain and mobility conditions.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Neck & Back Pain","Shoulder Pain","Knee Pain","Sports Injuries",
              "Post-Surgery Rehab","Sciatica","Joint & Muscle Pain",
              "Elderly Care","Neurological Rehab","Posture Correction",
            ].map((c) => (
              <span key={c} className="px-5 py-2.5 bg-white border border-teal-100 rounded-full text-sm font-semibold text-teal-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">Why Choose Us</h2>
            <p className="text-slate-500 mt-4 text-lg">
              Trusted by hundreds of patients for lasting results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <div key={p.title} className="text-center flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border border-slate-100 card-hover">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-2">
                  <p.Icon className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-display font-semibold text-teal-950">{p.title}</h3>
                <p className="text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-emerald-50 py-24 px-4 border-y border-emerald-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest rounded-full mb-4">Our Experts</span>
            <h2 className="text-4xl font-display font-bold text-teal-900">Meet the Team</h2>
            <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
              Qualified physiotherapists with deep clinical experience — your recovery is in expert hands.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-3xl border border-emerald-100 p-8 flex flex-col items-center gap-4 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full max-w-sm">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center shadow-md overflow-hidden border-4 border-white">
                  {(member as { photo?: string }).photo ? (
                    <img src={(member as { photo?: string }).photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="38" r="18" fill="#0f766e" opacity="0.7" />
                      <ellipse cx="50" cy="85" rx="28" ry="20" fill="#0f766e" opacity="0.5" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-teal-950">{member.name}</h3>
                  <p className="text-emerald-700 text-sm font-medium mt-0.5">{member.role}</p>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {member.specialties.map((s) => (
                    <span key={s} className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-teal-900">Our Locations</h2>
            <p className="text-slate-500 mt-3">Two convenient clinics serving Hyderabad.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                name: "Narayanguda",
                address: "Plot No. 11, Narayanguda, Hyderabad – 500029",
                hours: "Mon–Sat: 9 AM – 7 PM",
                phone: "+91 98765 43210",
              },
              {
                name: "Himayatnagar",
                address: "Himayatnagar Main Road, Hyderabad – 500029",
                hours: "Mon–Sat: 9 AM – 7 PM",
                phone: "+91 98765 43211",
              },
            ].map((loc) => (
              <div key={loc.name} className="rounded-3xl border border-teal-100 bg-teal-50/50 p-8 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-display font-semibold text-teal-900 text-lg">{loc.name}</h3>
                </div>
                <p className="text-slate-600 text-sm">{loc.address}</p>
                <p className="text-slate-500 text-sm">{loc.hours}</p>
                <p className="text-emerald-700 text-sm font-medium">{loc.phone}</p>
                <Link href="/contact" className="mt-2 inline-block text-sm font-semibold text-teal-800 hover:text-emerald-600 transition-colors">
                  Get Directions →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">What Our Patients Say</h2>
            <p className="text-slate-500 mt-4 text-lg">5.0 <span className="text-yellow-400">★</span> · 42 Google reviews</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex gap-1">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed flex-1 italic">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-2 pt-4 border-t border-slate-50">
                  <p className="text-sm font-semibold text-teal-950">{r.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-teal-900">Latest from Our Blog</h2>
            <p className="text-slate-500 mt-4 text-lg">
              Expert insights on recovery, rehabilitation, and wellness.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.map((p) => (
              <BlogCard key={p.id} {...p} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/blog"
              className="inline-block px-8 py-3 bg-white border border-teal-200 text-teal-800 rounded-full font-semibold hover:bg-teal-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              Read All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Ready to Start Your Recovery?</h2>
          <p className="text-teal-100 text-lg leading-relaxed max-w-2xl">
            Take the first step toward pain-free living. Our expert team is here
            to guide you every step of the way.
          </p>
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
