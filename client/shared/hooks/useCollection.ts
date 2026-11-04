"use client";
import { useEffect, useState } from "react";

type Page<T> = { items: T[]; total: number; page: number; limit: number };
type Params = Record<string, string | number | boolean | undefined>;

/** Delays text filtering and ignores responses from superseded requests. No transport ownership. */
export function useCollection<T>(loader: (params?: Params) => Promise<Page<T>>, initialFilters: Record<string, string> = {}) {
  const [filters, setFilterState] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<T>>({ items: [], total: 0, page: 1, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      loader({ ...filters, page, limit: 25 }).then(result => {
        if (!current) return;
        const lastPage = Math.max(1, Math.ceil(result.total / result.limit));
        if (page > lastPage) { setPage(lastPage); return; }
        setData(result);
      }).catch(reason => { if (current) setError(reason instanceof Error ? reason.message : "Unable to load records."); })
        .finally(() => { if (current) setLoading(false); });
    }, 200);
    return () => { current = false; window.clearTimeout(timer); };
  }, [loader, filters, page, revision]);
  return { ...data, page, filters, loading, error, setPage,
    setFilters: (next: Record<string, string>) => { setPage(1); setFilterState(next); },
    reload: () => setRevision(value => value + 1) };
}
