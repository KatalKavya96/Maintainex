import { Badge } from "@/design-system";
import { labelize } from "@/shared/lib/constants";
import type { ScheduledWorkStatus } from "@/types/scheduledWork";

export function WorkStatusBadge({ status }: { status: ScheduledWorkStatus }) {
  return <Badge tone={status === "DONE" ? "accent" : "neutral"}>{labelize(status)}</Badge>;
}
