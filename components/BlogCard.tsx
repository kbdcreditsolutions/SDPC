import Link from "next/link";

interface BlogCardProps {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  date: string;
}

export default function BlogCard({ title, slug, category, excerpt, date }: BlogCardProps) {
  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link href={`/blog/${slug}`} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 group">
      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full w-fit">
        {category}
      </span>
      <h3 className="text-base font-semibold text-slate-800 leading-snug group-hover:text-cyan-700 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{excerpt}</p>
      <p className="text-xs text-gray-400">{formatted}</p>
    </Link>
  );
}
