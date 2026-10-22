"use client";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="ds-state"><h2>{title}</h2><p>{description}</p>{action ? <div className="ds-state__actions">{action}</div> : null}</div>;
}
export function AsyncState({ state, children, onRetry }: { state: "loading" | "error" | "empty" | "ready"; children?: ReactNode; onRetry?: () => void }) {
  if (state === "ready") return <>{children}</>;
  if (state === "loading") return <p role="status" className="ds-state">Loading…</p>;
  if (state === "error") return <div role="alert" className="ds-state"><p>Unable to load this view.</p>{onRetry ? <Button variant="secondary" onClick={onRetry}>Retry</Button> : null}</div>;
  return <EmptyState title="Nothing here yet" description="Your records will appear here when available." />;
}
