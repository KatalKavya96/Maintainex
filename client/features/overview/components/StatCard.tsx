import { Metric } from "@/design-system";

export function StatCard({ label, value }: { label: string; value: number }) {
  return <Metric label={label} value={value} />;
}
