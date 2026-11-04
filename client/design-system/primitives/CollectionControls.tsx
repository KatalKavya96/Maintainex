"use client";
import { Button } from "./Button";

export function ViewSwitcher<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg border border-line p-1">{options.map(option=><Button key={option.value} size="sm" variant={value === option.value ? "secondary" : "ghost"} aria-pressed={value === option.value} onClick={()=>onChange(option.value)}>{option.label}</Button>)}</div>;
}

export function Pagination({ page, total, limit, onChange, disabled = false }: { page: number; total: number; limit: number; onChange: (page: number) => void; disabled?: boolean }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return <nav aria-label="Results pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-muted">{total ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total}` : "0 results"}</p><div className="flex items-center gap-3"><Button size="sm" variant="secondary" disabled={disabled || page <= 1} onClick={()=>onChange(page-1)}>Previous</Button><span className="text-xs text-muted">Page {page} of {pages}</span><Button size="sm" variant="secondary" disabled={disabled || page >= pages} onClick={()=>onChange(page+1)}>Next</Button></div></nav>;
}

export function Feedback({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border border-line px-4 py-3 text-sm ${tone === "error" ? "text-danger" : "text-moss"}`}>{message}</p>;
}
