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
    <article className="max-w-3xl mx-auto px-4 pt-36 pb-24">
      <header className="mb-12 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full w-fit mb-6 inline-block">
          {post.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-teal-950 leading-tight mb-6">
          {post.title}
        </h1>
        <p className="text-slate-500 font-medium">{formattedDate}</p>
      </header>
      
      <div className="prose prose-teal max-w-none text-slate-700 leading-relaxed text-lg">
        <p className="text-xl text-slate-600 font-medium italic border-l-4 border-teal-600 pl-6 py-2 mb-10 bg-slate-50/50 rounded-r-2xl">
          {post.excerpt}
        </p>
        
        {post.content && post.content.map((paragraph, idx) => (
          <p key={idx} className="mb-8">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
