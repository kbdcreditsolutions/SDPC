import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { blogPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Expert insights on physiotherapy, recovery, rehabilitation, and wellness from the Sridatri Physio Care team.",
};

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white pt-36 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 relative z-10">
          <h1 className="text-5xl font-display font-bold">Health &amp; Wellness Blog</h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Expert articles on physiotherapy techniques, injury prevention, and
            evidence-based recovery strategies.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((p) => (
              <BlogCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
