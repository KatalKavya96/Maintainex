"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartByDate, chartByOrganization, chartByRepository, chartByType } from "@/lib/analytics";
import { labelize } from "@/lib/constants";
import type { Activity } from "@/types/activity";

const colors = ["#C9F43A", "#5DE16F", "#60A5FA", "#8C7CF5", "#FB9638", "#CBD5E1", "#F87171", "#94A3B8"];

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
    <section className="rounded-2xl border border-line bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold tracking-tight text-ink">{title}</h3>
        <span className="rounded-lg border border-line bg-skyglass px-3 py-1 text-xs font-bold text-slate-400">Hover for counts</span>
      </div>
      <div className="h-72">
        {empty ? <div className="grid h-full place-items-center rounded-xl bg-skyglass text-lg font-bold text-slate-500">No activity yet.</div> : children}
      </div>
    </section>
  );
}

export function ActivityLineChart({ activities }: { activities: Activity[] }) {
  const data = chartByDate(activities);
  return (
    <ChartPanel title="Activity over time" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="count" stroke="#C9F43A" strokeWidth={3} dot={{ r: 4, fill: "#C9F43A" }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function ActivityTypeChart({ activities }: { activities: Activity[] }) {
  const data = chartByType(activities).map((item) => ({ ...item, name: labelize(item.name) }));
  return (
    <ChartPanel title="Contribution type distribution" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={54} paddingAngle={3}>
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
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="#C9F43A" radius={[8, 8, 0, 0]} barSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function OrgChart({ activities }: { activities: Activity[] }) {
  const data = chartByOrganization(activities);
  return (
    <ChartPanel title="Organization comparison" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--app-line)" vertical={false} opacity={0.55} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="#5DE16F" radius={[8, 8, 0, 0]} barSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
