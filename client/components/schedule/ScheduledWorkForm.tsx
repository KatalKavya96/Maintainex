"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { Field, Input, Select, Textarea } from "@/components/common/FormControls";
import { createScheduledWork, updateScheduledWork } from "@/lib/api";
import { labelize, priorities, scheduledWorkStatuses, scheduledWorkTypes, workDifficulties } from "@/lib/constants";
import type { Priority, ScheduledWork, ScheduledWorkStatus, ScheduledWorkType, WorkDifficulty } from "@/types/scheduledWork";
import { dateValue } from "./scheduleUtils";

const numberValue = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text ? Number(text) : undefined;
};

export function ScheduledWorkForm({ work }: { work?: ScheduledWork }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    const saved = work ? await updateScheduledWork(work.id, payload) : await createScheduledWork(payload);
    router.push(`/schedule/${saved.id}`);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-md border border-line bg-white p-5 shadow-soft">
      <section>
        <h3 className="mb-4 text-lg font-bold">Basic Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title"><Input name="title" required defaultValue={work?.title} placeholder="Review PR #1546" /></Field>
          <Field label="Type"><Select name="type" required defaultValue={work?.type ?? "ISSUE_WORK"}>{scheduledWorkTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}</Select></Field>
          <Field label="Status"><Select name="status" required defaultValue={work?.status ?? "PLANNED"}>{scheduledWorkStatuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}</Select></Field>
          <Field label="Priority"><Select name="priority" required defaultValue={work?.priority ?? "MEDIUM"}>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-lg font-bold">Repository Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization"><Input name="organizationName" required defaultValue={work?.organizationName} placeholder="layer5io" /></Field>
          <Field label="Repository"><Input name="repositoryName" required defaultValue={work?.repositoryName} placeholder="meshery" /></Field>
          <Field label="Item number"><Input name="itemNumber" type="number" min="1" defaultValue={work?.itemNumber ?? ""} /></Field>
          <Field label="Item URL"><Input name="itemUrl" defaultValue={work?.itemUrl ?? ""} placeholder="https://github.com/org/repo/issues/1" /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-lg font-bold">Assignment & Timeline</h3>
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input name="assignedToMe" type="checkbox" defaultChecked={work?.assignedToMe} className="h-4 w-4 rounded border-line" />Assigned to me</label>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Assigned since"><Input name="assignedSince" type="date" defaultValue={dateValue(work?.assignedSince)} /></Field>
          <Field label="Start date"><Input name="startDate" type="date" defaultValue={dateValue(work?.startDate)} /></Field>
          <Field label="Due date"><Input name="dueDate" type="date" defaultValue={dateValue(work?.dueDate)} /></Field>
          <Field label="Completed at"><Input name="completedAt" type="date" defaultValue={dateValue(work?.completedAt)} /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-lg font-bold">Effort & Metadata</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Estimated hours"><Input name="estimatedHours" type="number" min="0" step="0.25" defaultValue={work?.estimatedHours ?? ""} /></Field>
          <Field label="Actual hours"><Input name="actualHours" type="number" min="0" step="0.25" defaultValue={work?.actualHours ?? ""} /></Field>
          <Field label="Difficulty"><Select name="difficulty" defaultValue={work?.difficulty ?? ""}><option value="">Not set</option>{workDifficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</Select></Field>
          <Field label="Labels"><Input name="labels" defaultValue={work?.labels.join(", ")} placeholder="good-first-issue, docs" /></Field>
          <Field label="Tags"><Input name="tags" defaultValue={work?.tags.join(", ")} placeholder="review, backend" /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-lg font-bold">Extra Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Context"><Textarea name="context" defaultValue={work?.context ?? ""} /></Field>
          <Field label="Plan"><Textarea name="plan" defaultValue={work?.plan ?? ""} /></Field>
          <Field label="Blockers"><Textarea name="blockers" defaultValue={work?.blockers ?? ""} /></Field>
          <Field label="Closing notes"><Textarea name="closingNotes" defaultValue={work?.closingNotes ?? ""} /></Field>
        </div>
      </section>
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button href="/schedule" variant="secondary">Cancel</Button>
        <Button type="button" onClick={() => formRef.current?.requestSubmit()}>{work ? "Update work" : "Create work"}</Button>
      </div>
    </form>
  );
}
