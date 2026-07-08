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
    <Link href={`/blog/${slug}`} className="bg-transparent flex flex-col group card-hover h-full">
      {image && (
        <div className="relative w-full aspect-[4/3] shrink-0 rounded-3xl overflow-hidden mb-6 shadow-sm border-4 border-white">
          <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        </div>
      )}
      <div className="flex flex-col gap-3 px-2 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full w-fit">
          {category}
        </span>
        <h3 className="text-xl font-display font-semibold text-teal-950 leading-snug group-hover:text-teal-600 transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed flex-1 line-clamp-3">{excerpt}</p>
        <div className="pt-4 mt-2 flex items-center gap-3">
          {author && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-800 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {author.initials}
            </div>
          )}
          <div>
            {author && <p className="text-sm font-semibold text-teal-900">{author.name}</p>}
            <p className="text-xs font-medium text-slate-400">{formatted}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
