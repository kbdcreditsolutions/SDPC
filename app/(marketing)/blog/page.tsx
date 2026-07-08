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
      <section className="bg-transparent pt-36 pb-24 px-4 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 relative z-10">
          <span className="inline-block mx-auto px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold uppercase tracking-widest text-teal-700 shadow-sm">
            Insights
          </span>
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-teal-950 tracking-tight">Health &amp; Wellness Blog</h1>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Expert articles on physiotherapy techniques, injury prevention, and
            evidence-based recovery strategies.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-32 px-4 bg-slate-50">
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
