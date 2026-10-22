import type { ReactNode } from "react";

export function PageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: ReactNode; eyebrow?: string }) {
  return <header className="ds-page-header"><div className="min-w-0">
    {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
    <h1>{title}</h1>{description ? <p className="ds-page-header__description">{description}</p> : null}
  </div>{action ? <div className="ds-page-header__actions">{action}</div> : null}</header>;
}
