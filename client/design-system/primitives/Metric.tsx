import type { ReactNode } from "react";
import clsx from "clsx";

/** An unlabeled arrow is not a trend. Comparisons require an explicit scope/baseline. */
export function Metric({ label, value, detail, icon, className }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; className?: string }) {
  return <div className={clsx("ds-metric", className)}><div className="ds-metric__label">{label}{icon}</div>
    <div className="ds-metric__value">{value}</div>{detail ? <div className="ds-metric__detail">{detail}</div> : null}
  </div>;
}
