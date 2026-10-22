"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { searchWorkspace } from "@/data/api/search";
import { searchLabels, type SearchResponse } from "@/types/search";

export function UserSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const input = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const results = data?.items.slice(0, 8) ?? [];
  const ready = query.trim().length >= 2;
  const searchHref = `/search?q=${encodeURIComponent(query.trim())}`;

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
    function shortcutKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !target.isContentEditable && target.tagName !== "TEXTAREA") {
        event.preventDefault(); input.current?.focus(); setOpen(true);
      }
    }
    function outside(event: PointerEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    window.addEventListener("keydown", shortcutKey);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", shortcutKey); document.removeEventListener("pointerdown", outside); };
  }, []);
  useEffect(() => { setOpen(false); setQuery(""); setData(null); }, [pathname]);
  useEffect(() => {
    const request = new AbortController();
    setData(null); setActive(-1); setError("");
    if (!ready || !open) { setLoading(false); return; }
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchWorkspace(query.trim(), "all", 3, request.signal)
        .then((result) => { if (!request.signal.aborted) setData(result); })
        .catch((err) => { if (!request.signal.aborted) setError(err.message ?? "Search unavailable."); })
        .finally(() => { if (!request.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); request.abort(); };
  }, [query, ready, open]);

  return <form ref={container} role="search" className="relative w-full max-w-[560px]" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onSubmit={(event) => {
    event.preventDefault();
    if (!ready) return;
    const href = active >= 0 && results[active] ? results[active].href : searchHref;
    setOpen(false); input.current?.blur(); router.push(href);
  }}>
    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
    <input ref={input} role="combobox" aria-label="Search Maintainex" aria-expanded={open} aria-controls="workspace-search-results" aria-autocomplete="list" aria-activedescendant={open && active >= 0 && results[active] ? `workspace-result-${active}` : undefined} autoComplete="off" maxLength={120} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault(); setOpen(true);
        if (results.length) setActive((value) => event.key === "ArrowDown" ? (value + 1) % results.length : (value <= 0 ? results.length - 1 : value - 1));
      }
    }} placeholder="Search organizations, repositories, people…" className="h-10 w-full rounded-lg border border-line bg-[var(--app-bg)] pl-9 pr-16 text-sm text-ink outline-none transition placeholder:text-muted focus:border-moss/50" />
    <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">{shortcut}</kbd>
    {open ? <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-line bg-[var(--app-panel)] shadow-2xl">
      <p className="border-b border-line px-4 py-3 text-xs text-muted">Organizations, repositories, people, and your work & pins</p>
      <p role="status" className="px-4 py-3 text-sm text-muted">{!ready ? "Type at least two characters to search." : loading ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Searching…</span> : error || (results.length ? `${Object.values(data!.counts).reduce((sum, n) => sum + n, 0)} results found` : "No matches. Try a different name or keyword.")}</p>
      <ul id="workspace-search-results" role="listbox" aria-label="Search results" className="max-h-[min(55vh,380px)] overflow-y-auto p-1">
        {results.map((result, index) => <li key={`${result.kind}-${result.id}`} role="option" id={`workspace-result-${index}`} aria-selected={active === index}>
          <Link href={result.href} tabIndex={-1} onMouseDown={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()} onClick={() => setOpen(false)} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-3 ${active === index ? "bg-moss/10" : "hover:bg-[var(--app-elevated)]"}`}>
            <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{result.title}</span><span className="mt-1 block truncate text-xs text-muted">{searchLabels[result.kind]} · {result.subtitle}</span></span><ArrowUpRight size={14} className="shrink-0 text-moss" />
          </Link>
        </li>)}
      </ul>
      {ready ? <Link href={searchHref} onClick={() => setOpen(false)} className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-moss">View all results<ArrowUpRight size={14} /></Link> : null}
    </div> : null}
  </form>;
}
