"use client";

import { ComponentProps } from "react";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-moss focus:ring-4 focus:ring-moss/10"
      {...props}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
      {...props}
    />
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      className="min-h-28 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-moss focus:ring-4 focus:ring-moss/10"
      {...props}
    />
  );
}
