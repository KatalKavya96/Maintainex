import { Badge } from "@/design-system";
import { labelize } from "@/shared/lib/constants";

export function ActivityBadge({ value }: { value: string }) {
  return <Badge>{labelize(value)}</Badge>;
}
