"use client";

import { Feedback } from "@/design-system";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input, Select, Textarea } from "@/design-system/patterns/FormControls";
import { labelize, pinCategories } from "@/shared/lib/constants";
import { createPin, updatePin } from "@/data/api/pins";
import type { Pin, PinCategory } from "@/types/pin";

export function PinForm({ pin }: { pin?: Pin }) {
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
    const tags = String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      url: String(form.get("url") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category") ?? "WEBSITE") as PinCategory,
      customCategory: String(form.get("customCategory") ?? "").trim(),
      imageUrl: String(form.get("imageUrl") ?? "").trim(),
      iconUrl: pin?.iconUrl ?? "",
      faviconUrl: pin?.faviconUrl ?? "",
      isFavorite: form.get("isFavorite") === "on",
      isArchived: pin?.isArchived ?? false,
      tags,
      sortOrder: pin?.sortOrder ?? 0
    };
    try {
    const saved = pin ? await updatePin(pin.id, payload) : await createPin(payload);
    router.push(`/pins/${saved.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save. Your draft is still here."); }
    finally { setPending(false); }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6 rounded-xl border border-line bg-panel p-5 shadow-soft">
      <section>
        <h3 className="mb-4 text-base font-bold">Pin Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title"><Input name="title" required defaultValue={pin?.title} placeholder="Layer5 Website Repo" /></Field>
          <Field label="URL"><Input name="url" type="url" required defaultValue={pin?.url} placeholder="https://github.com/layer5io/layer5" /></Field>
          <Field label="Category">
            <Select name="category" required defaultValue={pin?.category ?? "WEBSITE"}>
              {pinCategories.map((category) => <option key={category} value={category}>{labelize(category)}</option>)}
            </Select>
          </Field>
          <Field label="Custom category"><Input name="customCategory" defaultValue={pin?.customCategory ?? ""} placeholder="Layer5" /></Field>
          <Field label="Image URL"><Input name="imageUrl" defaultValue={pin?.imageUrl ?? ""} placeholder="Optional custom image" /></Field>
          <Field label="Tags"><Input name="tags" defaultValue={pin?.tags.join(", ")} placeholder="github, review, docs" /></Field>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-base font-bold">Description</h3>
        <Textarea aria-label="Description" name="description" defaultValue={pin?.description ?? ""} />
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
          <input type="checkbox" name="isFavorite" defaultChecked={pin?.isFavorite} className="h-4 w-4 rounded border-line" />
          Favorite
        </label>
      </section>
      {error && <Feedback message={error} />}
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button href="/pins" variant="secondary">Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : pin ? "Save changes" : "Create pin"}</Button>
      </div>
    </form>
  );
}
