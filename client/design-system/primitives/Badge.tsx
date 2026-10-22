import clsx from "clsx";
import type { HTMLAttributes } from "react";

/** Color represents emphasis, not an arbitrary feature or category. */
export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "danger" }) {
  return <span {...props} className={clsx("ds-badge", `ds-badge--${tone}`, className)} />;
}
