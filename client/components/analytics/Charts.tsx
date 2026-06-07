"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartByDate, chartByOrganization, chartByRepository, chartByType } from "@/lib/analytics";
import { labelize } from "@/lib/constants";
import type { Activity } from "@/types/activity";

const colors = ["#C9F43A", "#5DE16F", "#60A5FA", "#8C7CF5", "#FB9638", "#CBD5E1", "#F87171", "#94A3B8"];
const truncate = (value: string, size = 12) => (value.length > size ? `${value.slice(0, size - 1)}...` : value);

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-soft">
      {label ? <p className="mb-1 font-bold text-ink">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="font-semibold text-slate-500">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name ?? "Count"}: <span className="text-ink">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

function ChartPanel({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-extrabold tracking-tight text-ink sm:text-base">{title}</h3>
        <span className="hidden shrink-0 rounded-lg border border-line bg-skyglass px-2.5 py-1 text-[11px] font-bold text-slate-400 sm:inline-flex">Hover for counts</span>
      </div>
      <div className="h-56 min-h-[14rem] w-full min-w-0 overflow-hidden sm:h-60">
        {empty ? <div className="grid h-full place-items-center rounded-lg bg-skyglass text-sm font-bold text-slate-500">No activity yet.</div> : children}
      </div>
    </section>
  );
}

export function ActivityLineChart({ activities }: { activities: Activity[] }) {
  const data = chartByDate(activities);
  return (
    <ChartPanel title="Activity over time" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="date" minTickGap={24} tick={{ fontSize: 11, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#C9F43A"
            strokeWidth={3}
            dot={{ r: 4, fill: "#C9F43A" }}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function ActivityTypeChart({ activities }: { activities: Activity[] }) {
  const data = chartByType(activities).map((item) => ({ ...item, name: labelize(item.name) }));
  return (
    <ChartPanel title="Contribution type distribution" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius="78%"
            innerRadius="48%"
            paddingAngle={3}
            isAnimationActive
            animationBegin={80}
            animationDuration={850}
            animationEasing="ease-out"
          >
            {data.map((item, index) => (
              <Cell key={item.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function RepoChart({ activities }: { activities: Activity[] }) {
  const data = chartByRepository(activities);
  return (
    <ChartPanel title="Repository comparison" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="name" tickFormatter={(value) => truncate(String(value))} interval={0} minTickGap={8} tick={{ fontSize: 11, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="#C9F43A" radius={[8, 8, 0, 0]} maxBarSize={34} isAnimationActive animationDuration={800} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function OrgChart({ activities }: { activities: Activity[] }) {
  const data = chartByOrganization(activities);
  return (
    <ChartPanel title="Organization comparison" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%" debounce={80}>
        <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="name" tickFormatter={(value) => truncate(String(value))} interval={0} minTickGap={8} tick={{ fontSize: 11, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="#5DE16F" radius={[8, 8, 0, 0]} maxBarSize={34} isAnimationActive animationDuration={800} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
