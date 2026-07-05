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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-cyan-700" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-[#134E4A]">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
