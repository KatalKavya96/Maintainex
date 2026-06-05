"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartByDate, chartByOrganization, chartByRepository, chartByType } from "@/lib/analytics";
import { labelize } from "@/lib/constants";
import type { Activity } from "@/types/activity";

const colors = ["#2F6F5E", "#E76F51", "#3478A7", "#C79A32", "#7A5C99", "#4A7C59", "#D45D79", "#64748B"];

function ChartPanel({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <div className="h-72">
        {empty ? <div className="grid h-full place-items-center rounded-md bg-slate-50 text-sm font-medium text-slate-500">No activity yet.</div> : children}
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
          <CartesianGrid stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2F6F5E" strokeWidth={3} dot={{ r: 4 }} />
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
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((item, index) => (
              <Cell key={item.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
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
          <CartesianGrid stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#3478A7" radius={[4, 4, 0, 0]} />
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
          <CartesianGrid stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#E76F51" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
