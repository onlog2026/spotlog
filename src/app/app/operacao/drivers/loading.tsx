export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-16 rounded-xl bg-card/50 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
