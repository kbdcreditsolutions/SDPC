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
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Health &amp; Wellness Blog</h1>
          <p className="text-cyan-100 text-lg">
            Expert articles on physiotherapy techniques, injury prevention, and
            evidence-based recovery strategies.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((p) => (
              <BlogCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
