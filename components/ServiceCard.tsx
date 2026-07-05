interface ServiceCardProps {
  title: string;
  icon: string;
  description: string;
  tags: string[];
}

export default function ServiceCard({ title, icon, description, tags }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
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
