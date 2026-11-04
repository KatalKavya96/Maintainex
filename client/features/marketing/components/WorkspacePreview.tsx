import { Badge, Surface } from "@/design-system";

/** Static workflow explanation; contains no fabricated records or statistics. */
export function WorkspacePreview() {
  return <Surface className="overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4"><span className="text-sm font-medium">A calmer contribution workflow</span><Badge>Plan · Contribute · Reflect</Badge></div>
    <div className="grid md:grid-cols-[180px_1fr]"><div className="hidden border-r border-line p-5 text-sm text-muted md:block"><p className="mb-5 font-semibold text-ink">Your workspace</p><div className="space-y-4"><p className="text-moss">Overview</p><p>Activities</p><p>Work</p><p>Pins</p></div></div>
      <div className="p-6 sm:p-8"><p className="font-mono text-xs text-muted">YOUR CONTRIBUTION WORKFLOW</p><h3 className="mt-3 text-xl font-medium tracking-tight">Pick up where you left off.</h3><div className="mt-6 divide-y divide-line">{[["01","Read the issue and capture context","Plan"],["02","Make the change, keep the reference","Contribute"],["03","Record the outcome and next step","Reflect"]].map(([n,title,status])=><div key={n} className="flex items-center gap-4 py-4"><span className="font-mono text-xs text-muted">{n}</span><span className="flex-1 text-sm">{title}</span><Badge>{status}</Badge></div>)}</div></div>
    </div></Surface>;
}
