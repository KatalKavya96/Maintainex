"use client";

import { Feedback } from "@/design-system";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input, Select, Textarea } from "@/design-system/patterns/FormControls";
import { createScheduledWork, updateScheduledWork } from "@/data/api/work";
import { labelize, priorities, scheduledWorkStatuses, scheduledWorkTypes, workDifficulties } from "@/shared/lib/constants";
import type { Priority, ScheduledWork, ScheduledWorkStatus, ScheduledWorkType, WorkDifficulty } from "@/types/scheduledWork";
import { dateValue } from "./scheduleUtils";

const numberValue = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text ? Number(text) : undefined;
};

export function ScheduledWorkForm({ work, seed }: { work?: ScheduledWork; seed?: Partial<ScheduledWork> }) {
  const initial = work ?? seed;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const csv = (name: string) => String(form.get(name) ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      type: String(form.get("type")) as ScheduledWorkType,
      status: String(form.get("status")) as ScheduledWorkStatus,
      priority: String(form.get("priority")) as Priority,
      organizationName: String(form.get("organizationName") ?? "").trim(),
      repositoryName: String(form.get("repositoryName") ?? "").trim(),
      itemNumber: numberValue(form.get("itemNumber")),
      itemUrl: String(form.get("itemUrl") ?? "").trim(),
      assignedToMe: form.get("assignedToMe") === "on",
      assignedSince: String(form.get("assignedSince") ?? ""),
      startDate: String(form.get("startDate") ?? ""),
      dueDate: String(form.get("dueDate") ?? ""),
      completedAt: String(form.get("completedAt") ?? ""),
      estimatedHours: numberValue(form.get("estimatedHours")),
      actualHours: numberValue(form.get("actualHours")),
      labels: csv("labels"),
      tags: csv("tags"),
      difficulty: (String(form.get("difficulty") ?? "") || undefined) as WorkDifficulty | undefined,
      context: String(form.get("context") ?? "").trim(),
      plan: String(form.get("plan") ?? "").trim(),
      blockers: String(form.get("blockers") ?? "").trim(),
      closingNotes: String(form.get("closingNotes") ?? "").trim()
    };
    try {
    const saved = work ? await updateScheduledWork(work.id, payload) : await createScheduledWork(payload);
    router.push(`/schedule/${saved.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save. Your draft is still here."); }
    finally { setPending(false); }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6 rounded-xl border border-line bg-panel p-5 shadow-soft">
      <section>
        <h3 className="mb-4 text-base font-bold">Basic Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title"><Input name="title" required defaultValue={initial?.title} placeholder="Review PR #1546" /></Field>
          <Field label="Type"><Select name="type" required defaultValue={initial?.type ?? "ISSUE_WORK"}>{scheduledWorkTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}</Select></Field>
          <Field label="Status"><Select name="status" required defaultValue={initial?.status ?? "PLANNED"}>{scheduledWorkStatuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}</Select></Field>
          <Field label="Priority"><Select name="priority" required defaultValue={initial?.priority ?? "MEDIUM"}>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-base font-bold">Repository Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization"><Input name="organizationName" required defaultValue={initial?.organizationName} placeholder="layer5io" /></Field>
          <Field label="Repository"><Input name="repositoryName" required defaultValue={initial?.repositoryName} placeholder="meshery" /></Field>
          <Field label="Item number"><Input name="itemNumber" type="number" min="1" defaultValue={initial?.itemNumber ?? ""} /></Field>
          <Field label="Item URL"><Input type="url" name="itemUrl" defaultValue={initial?.itemUrl ?? ""} placeholder="https://github.com/org/repo/issues/1" /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-base font-bold">Assignment & Timeline</h3>
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted"><input name="assignedToMe" type="checkbox" defaultChecked={initial?.assignedToMe} className="h-4 w-4 rounded border-line" />Assigned to me</label>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Assigned since"><Input name="assignedSince" type="date" defaultValue={dateValue(initial?.assignedSince)} /></Field>
          <Field label="Start date"><Input name="startDate" type="date" defaultValue={dateValue(initial?.startDate)} /></Field>
          <Field label="Due date"><Input name="dueDate" type="date" defaultValue={dateValue(initial?.dueDate)} /></Field>
          <Field label="Completed at"><Input name="completedAt" type="date" defaultValue={dateValue(initial?.completedAt)} /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-base font-bold">Context & next action</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Context"><Textarea name="context" defaultValue={initial?.context ?? ""} /></Field>
          <Field label="Next action / plan"><Textarea name="plan" defaultValue={initial?.plan ?? ""} /></Field>
          <Field label="Blockers"><Textarea name="blockers" defaultValue={initial?.blockers ?? ""} /></Field>
          <Field label="Closing notes"><Textarea name="closingNotes" defaultValue={initial?.closingNotes ?? ""} /></Field>
        </div>
      </section>
      <details className="rounded-lg border border-line p-4">
        <summary className="mb-4 cursor-pointer text-sm font-medium">Optional effort & metadata</summary>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Estimated hours"><Input name="estimatedHours" type="number" min="0" step="0.25" defaultValue={initial?.estimatedHours ?? ""} /></Field>
          <Field label="Actual hours"><Input name="actualHours" type="number" min="0" step="0.25" defaultValue={initial?.actualHours ?? ""} /></Field>
          <Field label="Difficulty"><Select name="difficulty" defaultValue={initial?.difficulty ?? ""}><option value="">Not set</option>{workDifficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</Select></Field>
          <Field label="Labels"><Input name="labels" defaultValue={initial?.labels?.join(", ")} placeholder="good-first-issue, docs" /></Field>
          <Field label="Tags"><Input name="tags" defaultValue={initial?.tags?.join(", ")} placeholder="review, backend" /></Field>
        </div>
      </details>
      {error && <Feedback message={error} />}
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button href="/schedule" variant="secondary">Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : work ? "Save changes" : "Create work"}</Button>
      </div>
    </form>
  );
}
