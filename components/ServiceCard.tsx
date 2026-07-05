import {
  Bone,
  Zap,
  Brain,
  Target,
  Dumbbell,
  PersonStanding,
  Home,
  Bike,
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
};

interface ServiceCardProps {
  title: string;
  icon: string;
  description: string;
  tags: string[];
}

export default function ServiceCard({ title, icon, description, tags }: ServiceCardProps) {
  const Icon = iconMap[icon] ?? Zap;
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col gap-4 card-hover">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
        <Icon className="w-7 h-7 text-teal-600" strokeWidth={1.5} />
      </div>
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
  );
}
