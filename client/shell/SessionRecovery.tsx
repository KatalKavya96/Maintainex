"use client";
import { Button } from "@/design-system";

export function SessionRecovery({ message, onRetry, onLogout }: { message: string; onRetry: () => void; onLogout: () => void }) {
  return <main className="mx-auto grid min-h-screen max-w-lg content-center gap-4 p-6">
    <h1 className="text-xl font-semibold text-ink">Unable to connect</h1>
    <p role="alert" className="text-sm text-muted">{message}</p>
    <div className="flex gap-3"><Button onClick={onRetry}>Retry</Button><Button variant="secondary" onClick={onLogout}>Sign out</Button></div>
  </main>;
}
