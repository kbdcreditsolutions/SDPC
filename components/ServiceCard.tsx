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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex flex-col card-hover overflow-hidden">
      {image ? (
        <div className="relative w-full h-44 shrink-0">
          <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 to-transparent" />
          <div className="absolute bottom-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center m-8 mb-0">
          <Icon className="w-7 h-7 text-teal-600" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex flex-col gap-4 p-8 flex-1">
        <h3 className="text-xl font-display font-semibold text-teal-950">{title}</h3>
        <p className="text-slate-600 leading-relaxed flex-1">{description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-100 text-teal-700 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
