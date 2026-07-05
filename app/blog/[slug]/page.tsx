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
        
        <p className="mb-6">
          This is a placeholder for the full article content. When a full CMS is connected or more data is provided, the complete blog content for &quot;{post.title}&quot; will be rendered here. For now, this serves to demonstrate the dynamic routing and presentation layer of the Sridatri Physio Care blog.
        </p>
        
        <p>
          Proper physiotherapy, like the techniques highlighted in this excerpt about <strong>{post.category.toLowerCase()}</strong>, can make a lasting difference in your quality of life. Always consult a qualified professional before starting any rigorous treatment program.
        </p>
      </div>
    </article>
  );
}
