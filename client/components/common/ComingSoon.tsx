import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/common/Button";

export function ComingSoon({ featureName, description }: { featureName: string; description?: string }) {
  return (
    <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center">
      <div className="w-full rounded-lg border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-moss">Coming soon</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{featureName}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-500">
          {description ?? "This Maintainex experience is being connected to real GitHub-backed data and will be available soon."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/dashboard" variant="secondary">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <Button href="/explore/organizations">
            <Compass size={16} />
            Explore Organizations
          </Button>
        </div>
      </div>
    </section>
  );
}
