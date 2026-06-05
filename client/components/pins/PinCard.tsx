"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, FileText, FolderGit2, Globe2, LayoutPanelTop, Pencil, Star, Trash2, Users } from "lucide-react";
import clsx from "clsx";
import { labelize } from "@/lib/constants";
import { markPinOpened, toggleFavoritePin } from "@/lib/api";
import type { Pin } from "@/types/pin";

const icons = {
  REPOSITORY: FolderGit2,
  ISSUE: FileText,
  PULL_REQUEST: GitPullRequestIcon,
  DOCUMENTATION: BookOpen,
  PROJECT_BOARD: LayoutPanelTop,
  ORGANIZATION: Users,
  WEBSITE: Globe2,
  OTHER: Globe2
};

function GitPullRequestIcon({ size = 22 }: { size?: number }) {
  return <FolderGit2 size={size} />;
}

export function PinCard({ pin, onChanged, onDelete }: { pin: Pin; onChanged: () => void; onDelete: (pin: Pin) => void }) {
  const Icon = icons[pin.category];
  const domain = (() => {
    try {
      return new URL(pin.url).hostname.replace(/^www\./, "");
    } catch {
      return pin.url;
    }
  })();

  async function openPin() {
    await markPinOpened(pin.id).catch(() => undefined);
    window.open(pin.url, "_blank", "noopener,noreferrer");
  }

  return (
    <article className="group flex h-full flex-col rounded-md border border-line bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <button type="button" onClick={openPin} className="flex flex-1 text-left">
        <div className="mr-3 grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-skyglass text-moss">
          {pin.imageUrl || pin.faviconUrl ? <img src={pin.imageUrl || pin.faviconUrl || ""} alt="" className="h-8 w-8 object-contain" /> : <Icon size={23} />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-ink">{pin.title}</h3>
          <p className="truncate text-sm text-slate-500">{domain}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{pin.customCategory || labelize(pin.category)}</span>
            {pin.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">{tag}</span>
            ))}
          </div>
        </div>
      </button>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <button title="Favorite" className={clsx("rounded-md p-2 transition hover:bg-amber-50", pin.isFavorite ? "text-amber-500" : "text-slate-400")} onClick={async () => { await toggleFavoritePin(pin.id); onChanged(); }}>
          <Star size={18} fill={pin.isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="flex gap-1">
          <button title="Open" className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100" onClick={openPin}><ExternalLink size={18} /></button>
          <Link title="Edit" className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100" href={`/pins/${pin.id}/edit`}><Pencil size={18} /></Link>
          <button title="Delete" className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(pin)}><Trash2 size={18} /></button>
        </div>
      </div>
    </article>
  );
}
