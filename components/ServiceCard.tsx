import Image from "next/image";
import {
  Bone,
  Zap,
  Brain,
  Target,
  Dumbbell,
  PersonStanding,
  Home,
  Bike,
  Baby,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Bone,
  Zap,
  Brain,
  Target,
  Dumbbell,
  PersonStanding,
  Home,
  Bike,
  Baby,
};

interface ServiceCardProps {
  title: string;
  icon: string;
  image?: string;
  description: string;
  tags: string[];
}

export default function ServiceCard({ title, icon, image, description, tags }: ServiceCardProps) {
  const Icon = iconMap[icon] ?? Zap;
  return (
    <div className="bg-transparent group flex flex-col h-full card-hover">
      {image ? (
        <div className="relative w-full aspect-[4/3] shrink-0 rounded-[40px] overflow-hidden mb-6 shadow-md shadow-slate-200/50 border-4 border-white">
          <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-950/40 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-4 left-4 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6 text-teal-800" strokeWidth={1.5} />
          </div>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-[24px] bg-teal-50 flex items-center justify-center mb-6 shadow-sm border border-white">
          <Icon className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex flex-col gap-3 px-2 flex-1">
        <h3 className="text-2xl font-display font-semibold text-teal-950">{title}</h3>
        <p className="text-slate-600 leading-relaxed flex-1">{description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 bg-white border border-slate-100 text-teal-700 rounded-full font-medium shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
