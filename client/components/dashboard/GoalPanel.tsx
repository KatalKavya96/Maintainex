"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input, Select } from "@/components/common/FormControls";
import { createGoal, deleteGoal, getGoals } from "@/lib/api";
import type { Goal, GoalInput, GoalMetric, GoalPeriod } from "@/types/social";

const metrics: GoalMetric[] = ["PR_REVIEWED", "PR_RAISED", "ISSUE_RAISED", "ISSUE_CLOSED", "REPO_CONTRIBUTIONS", "TOTAL_ACTIVITY", "STREAK"];
const periods: GoalPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export function GoalPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<GoalInput>({ title: "Review 20 PRs this month", metric: "PR_REVIEWED", target: 20, period: "MONTHLY" });

  const load = () => getGoals().then(setGoals).catch(() => setGoals([]));

  useEffect(() => {
    load();
  }, []);

  const activeGoals = useMemo(() => goals.slice(0, 3), [goals]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createGoal(form);
    setForm({ ...form, title: "", target: 1 });
    setExpanded(false);
    load();
  }

  async function remove(id: string) {
    await deleteGoal(id);
    load();
  }

  return (
    <section className="rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-ink">Goals</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">Track focused contribution targets from the dashboard.</p>
        </div>
        <Button type="button" onClick={() => setExpanded((value) => !value)} className="h-9">
          <Plus size={15} />
          New goal
        </Button>
      </div>

      {expanded ? (
        <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-line bg-skyglass p-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(130px,1fr)_minmax(90px,.7fr)_minmax(110px,.8fr)_auto]">
          <Field label="Goal">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </Field>
          <Field label="Metric">
            <Select value={form.metric} onChange={(event) => setForm({ ...form, metric: event.target.value as GoalMetric })}>
              {metrics.map((metric) => (
                <option key={metric} value={metric}>{metric.replaceAll("_", " ")}</option>
              ))}
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
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {activeGoals.map((goal) => (
          <article key={goal.id} className="min-w-0 rounded-lg border border-line bg-skyglass p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{goal.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{goal.metric.replaceAll("_", " ")} · {goal.period}</p>
              </div>
              <button type="button" onClick={() => remove(goal.id)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-red-400" title="Delete goal">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                <span>{goal.progress} / {goal.target}</span>
                <span>{goal.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-moss" style={{ width: `${goal.percent}%` }} />
              </div>
            </div>
          </article>
        ))}
        {!goals.length ? <p className="rounded-lg border border-dashed border-line bg-skyglass p-4 text-sm font-semibold text-slate-500 lg:col-span-3">No goals yet. Add one when you want a target for the week.</p> : null}
      </div>
    </section>
  );
}
