"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Field, Input, Select } from "@/components/common/FormControls";
import { PageTitle } from "@/components/common/PageTitle";
import { createGoal, deleteGoal, getGoals } from "@/lib/api";
import type { Goal, GoalInput, GoalMetric, GoalPeriod } from "@/types/social";

const metrics: GoalMetric[] = ["PR_REVIEWED", "PR_RAISED", "ISSUE_RAISED", "ISSUE_CLOSED", "REPO_CONTRIBUTIONS", "TOTAL_ACTIVITY", "STREAK"];
const periods: GoalPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<GoalInput>({ title: "Review 20 PRs this month", metric: "PR_REVIEWED", target: 20, period: "MONTHLY" });

  const load = () => getGoals().then(setGoals).catch(() => setGoals([]));
  useEffect(() => {
    load();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createGoal(form);
    setForm({ ...form, title: "", target: 1 });
    load();
  }

  async function remove(id: string) {
    await deleteGoal(id);
    load();
  }

  return (
    <>
      <PageTitle title="Goals" description="Set contribution goals and track progress automatically." />
      <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-soft lg:grid-cols-[1.4fr_1fr_.7fr_.8fr_auto]">
        <Field label="Goal">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </Field>
        <Field label="Metric">
          <Select value={form.metric} onChange={(event) => setForm({ ...form, metric: event.target.value as GoalMetric })}>
            {metrics.map((metric) => <option key={metric} value={metric}>{metric.replaceAll("_", " ")}</option>)}
          </Select>
        </Field>
        <Field label="Target">
          <Input type="number" min={1} value={form.target} onChange={(event) => setForm({ ...form, target: Number(event.target.value) })} required />
        </Field>
        <Field label="Period">
          <Select value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value as GoalPeriod })}>
            {periods.map((period) => <option key={period} value={period}>{period}</option>)}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Add</Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <article key={goal.id} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-ink">{goal.title}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{goal.metric.replaceAll("_", " ")} · {goal.period}</p>
              </div>
              <button type="button" onClick={() => remove(goal.id)} className="text-sm font-bold text-slate-500 hover:text-red-400">Delete</button>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
                <span>{goal.progress} / {goal.target}</span>
                <span>{goal.percent}%</span>
              </div>
              <div className="h-3 rounded-full bg-skyglass">
                <div className="h-3 rounded-full bg-moss" style={{ width: `${goal.percent}%` }} />
              </div>
            </div>
          </article>
        ))}
        {!goals.length ? <div className="rounded-2xl border border-line bg-white p-8 text-sm font-semibold text-slate-500 shadow-soft">No goals yet.</div> : null}
      </div>
    </>
  );
}
