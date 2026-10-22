import type { ReactNode } from "react";
import { Badge } from "../primitives/Badge";
export function TechTag({ children, className }: { children: ReactNode; className?: string }) {
  return <Badge className={className}>{children}</Badge>;
}
