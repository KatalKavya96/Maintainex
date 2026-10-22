import { Badge } from "@/design-system";
import type { ScheduledWorkStatus } from "@/types/scheduledWork";
import { dueStatus } from "./scheduleUtils";

export function DueStatusBadge({ dueDate, status }: { dueDate?: string | null; status: ScheduledWorkStatus }) {
  return <Badge tone={status === "DONE" ? "accent" : "neutral"}>{dueStatus(dueDate, status)}</Badge>;
}
