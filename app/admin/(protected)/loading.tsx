export default function ProtectedLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-sand/60 rounded-lg"></div>
        <div className="h-4 w-64 bg-sand/40 rounded mt-2"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-sand bg-white/60 p-6">
            <div className="h-3 w-24 bg-sand/60 rounded mb-4"></div>
            <div className="h-8 w-32 bg-sand/80 rounded mb-2"></div>
            <div className="h-3 w-40 bg-sand/40 rounded"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-sand bg-white/60 p-6 h-72">
            <div className="h-3 w-24 bg-sand/60 rounded mb-2"></div>
            <div className="h-6 w-48 bg-sand/80 rounded mb-6"></div>
            <div className="h-40 w-full bg-sand/30 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
