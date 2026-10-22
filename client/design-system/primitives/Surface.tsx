import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export function Surface({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={clsx("ds-surface", className)} />;
}
export function Toolbar({ label, children }: { label: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className="ds-toolbar">{children}</div>;
}
