import { Badge } from "@/design-system";
import { labelize } from "@/shared/lib/constants";
import type { Priority } from "@/types/scheduledWork";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge>{labelize(priority)}</Badge>;
}
