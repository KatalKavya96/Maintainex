"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { FormEvent } from "react";
import { activityTypes, closingReasons, labelize, reviewTypes, statuses } from "@/lib/constants";
import { Button } from "@/components/common/Button";
import { Field, Input, Select, Textarea } from "@/components/common/FormControls";
import { useActivityStore } from "@/lib/activityStore";
import type { Activity, ActivityStatus, ActivityType, ClosingReason, ReviewType } from "@/types/activity";

const today = () => new Date().toISOString().slice(0, 10);

export function ActivityForm({ activity }: { activity?: Activity }) {
  const router = useRouter();
  const { addActivity, updateActivity } = useActivityStore();
  const formRef = useRef<HTMLFormElement>(null);

  async function save(formElement: HTMLFormElement) {
    const form = new FormData(formElement);
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      date: String(form.get("date")),
      activityType: String(form.get("activityType")) as ActivityType,
      organizationName: String(form.get("organizationName")).trim(),
      repositoryName: String(form.get("repositoryName")).trim(),
      title: String(form.get("title")).trim(),
      number: String(form.get("number") ?? "").trim(),
      link: String(form.get("link") ?? "").trim(),
      status: String(form.get("status")) as ActivityStatus,
      reviewType: String(form.get("reviewType")) as ReviewType,
      closingReason: String(form.get("closingReason")) as ClosingReason,
      description: String(form.get("description") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
      tags
    };

    if (activity) {
      await updateActivity(activity.id, payload);
      router.push(`/activities/${activity.id}`);
      return;
    }

    await addActivity(payload);
    router.push("/activities");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(event.currentTarget);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-md border border-line bg-white p-5 shadow-soft">
      <section>
        <h3 className="mb-4 text-lg font-bold">Basic Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date">
            <Input name="date" type="date" required defaultValue={activity?.date ?? today()} />
          </Field>
          <Field label="Activity type">
            <Select name="activityType" defaultValue={activity?.activityType ?? "PR_REVIEWED"}>
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {labelize(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input name="title" required defaultValue={activity?.title} placeholder="Update Meshery Playground screenshots" />
          </Field>
          <Field label="Number">
            <Input name="number" defaultValue={activity?.number} placeholder="#7671" />
          </Field>
          <Field label="GitHub link">
            <Input name="link" defaultValue={activity?.link} placeholder="https://github.com/org/repo/pull/1" />
          </Field>
          <Field label="Tags">
            <Input name="tags" defaultValue={activity?.tags.join(", ")} placeholder="review, docs, triage" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold">Repository Info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization">
            <Input name="organizationName" required defaultValue={activity?.organizationName} placeholder="layer5io" />
          </Field>
          <Field label="Repository">
            <Input name="repositoryName" required defaultValue={activity?.repositoryName} placeholder="meshery.io" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold">Status & Review Info</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <Select name="status" defaultValue={activity?.status ?? "OPEN"}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {labelize(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Review type">
            <Select name="reviewType" defaultValue={activity?.reviewType ?? "NOT_APPLICABLE"}>
              {reviewTypes.map((type) => (
                <option key={type} value={type}>
                  {labelize(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Closing reason">
            <Select name="closingReason" defaultValue={activity?.closingReason ?? "NOT_APPLICABLE"}>
              {closingReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {labelize(reason)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold">Notes</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Description">
            <Textarea name="description" defaultValue={activity?.description} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" defaultValue={activity?.notes} />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
        <Button href="/activities" variant="secondary">
          Cancel
        </Button>
        <Button type="button" onClick={() => formRef.current?.requestSubmit()}>
          {activity ? "Update activity" : "Create activity"}
        </Button>
      </div>
    </form>
  );
}
