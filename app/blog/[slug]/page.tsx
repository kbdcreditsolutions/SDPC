import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data";

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <header className="mb-10 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full w-fit mb-4 inline-block">
          {post.category}
        </span>
        <h1 className="text-4xl font-bold text-slate-800 leading-tight mt-4 mb-4">
          {post.title}
        </h1>
        <p className="text-gray-500">{formattedDate}</p>
      </header>
      
      <div className="prose prose-cyan max-w-none text-gray-700 leading-relaxed text-lg">
        <p className="text-xl text-gray-600 italic border-l-4 border-cyan-700 pl-6 py-2 mb-8 bg-gray-50 rounded-r-lg">
          {post.excerpt}
        </p>
        
        {post.content && post.content.map((paragraph, idx) => (
          <p key={idx} className="mb-6">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
