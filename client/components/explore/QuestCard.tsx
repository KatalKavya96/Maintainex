import { Rocket, Trophy } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { OrganizationQuestsResponse } from "@/types/explore";

type Quest = OrganizationQuestsResponse["items"][number];

export function QuestCard({ quest }: { quest: Quest }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-moss">{quest.type}</p>
          <h3 className="mt-1 text-base font-extrabold text-ink">{quest.title}</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded border border-moss/30 bg-moss/10 px-2 py-1 text-xs font-extrabold text-moss">
          <Trophy size={14} />
          {quest.points} pts
        </span>
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{quest.description}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded border border-line bg-skyglass px-2 py-1 text-xs font-bold text-slate-400">{quest.difficulty}</span>
        <Button href="/coming-soon?feature=start-quest" className="h-8">
          <Rocket size={14} />
          Start Quest
        </Button>
      </div>
    </article>
  );
}
