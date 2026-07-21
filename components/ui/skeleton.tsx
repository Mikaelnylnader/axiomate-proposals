export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 rounded bg-accent/60 animate-pulse"
                style={{ width: `${35 + Math.sin(r + c) * 15 + (c === 0 ? 10 : 0)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="h-5 w-1/3 rounded bg-accent/60 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-accent/60 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-accent/60 animate-pulse" />
      </div>
    </div>
  );
}
