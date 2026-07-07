import Link from "next/link";
import Image from "next/image";

interface BlogCardProps {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  date: string;
  image?: string;
  author?: { name: string; initials: string };
}

export default function BlogCard({ title, slug, category, excerpt, date, image, author }: BlogCardProps) {
  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link href={`/blog/${slug}`} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex flex-col group card-hover overflow-hidden">
      {image && (
        <div className="relative w-full h-48 shrink-0">
          <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-8 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full w-fit">
          {category}
        </span>
        <h3 className="text-lg font-display font-semibold text-teal-950 leading-snug group-hover:text-emerald-600 transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed flex-1">{excerpt}</p>
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          {author && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {author.initials}
            </div>
          )}
          <div>
            {author && <p className="text-xs font-semibold text-teal-800">{author.name}</p>}
            <p className="text-xs font-medium text-slate-400">{formatted}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
