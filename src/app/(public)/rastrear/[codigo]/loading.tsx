export default function Loading() {
  return (
    <div className="bg-gradient-soft">
      <section className="border-b border-ink-200 bg-white">
        <div className="container py-6 pt-28 lg:pt-32">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-ink-200" />
        </div>
      </section>
      <section className="py-10 lg:py-14">
        <div className="container">
          <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-card lg:p-10">
            <div className="h-6 w-40 animate-pulse rounded-full bg-ink-200" />
            <div className="mt-4 h-10 w-3/4 animate-pulse rounded-lg bg-ink-200" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-ink-100" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
                  <div className="h-5 w-28 animate-pulse rounded bg-ink-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="pb-16">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-white shadow-sm"
                />
              ))}
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
