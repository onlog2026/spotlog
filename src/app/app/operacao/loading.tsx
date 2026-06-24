export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-xl bg-card/50 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-card/50 animate-pulse" />
    </div>
  );
}
