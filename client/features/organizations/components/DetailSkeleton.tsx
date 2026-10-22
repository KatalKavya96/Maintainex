"use client";

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-lg border border-line bg-panel p-6 shadow-soft">
        <div className="flex gap-5">
          <div className="h-28 w-28 rounded-full bg-skyglass" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 rounded bg-skyglass" />
            <div className="h-4 w-96 max-w-full rounded bg-skyglass" />
            <div className="h-4 w-80 max-w-full rounded bg-skyglass" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-lg bg-panel" />
        <div className="h-64 animate-pulse rounded-lg bg-panel" />
        <div className="h-64 animate-pulse rounded-lg bg-panel" />
      </div>
    </div>
  );
}
