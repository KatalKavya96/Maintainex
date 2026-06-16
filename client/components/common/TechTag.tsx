import type { ReactNode } from "react";
import clsx from "clsx";

export function TechTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex h-6 items-center rounded border border-moss/20 bg-[#1d2617] px-2 text-[11px] font-semibold text-moss/90", className)}>
      {children}
    </span>
  );
}
