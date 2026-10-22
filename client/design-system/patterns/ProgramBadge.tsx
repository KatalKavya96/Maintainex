import { Boxes, Cloud, Cpu, GraduationCap, Hexagon } from "lucide-react";
import clsx from "clsx";

const iconByProgram: Record<string, typeof GraduationCap> = {
  GSOC: GraduationCap,
  LFX: Boxes,
  CNCF: Cloud,
  OUTREACHY: Hexagon,
  MLH: Cpu
};

export function ProgramBadge({ name, className }: { name: string; className?: string }) {
  const Icon = iconByProgram[name.toUpperCase()] ?? Hexagon;
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1 rounded border border-moss/30 bg-moss/10 px-2 text-[11px] font-semibold text-moss", className)}>
      <Icon size={13} />
      {name}
    </span>
  );
}
