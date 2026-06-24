export default function SuperAdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-1/3 rounded bg-white/10 animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
    </div>
  );
}
