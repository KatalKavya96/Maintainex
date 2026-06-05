"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { Field, Input, Select, Textarea } from "@/components/common/FormControls";
import { labelize, pinCategories } from "@/lib/constants";
import { createPin, updatePin } from "@/lib/api";
import type { Pin, PinCategory } from "@/types/pin";

export function PinForm({ pin }: { pin?: Pin }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const faviconPreview = useMemo(() => {
    const source = pin?.url || "";
    if (!source) return "";
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(source).hostname}&sz=128`;
    } catch {
      return "";
    }
  }, [pin?.url]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tags = String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      url: String(form.get("url") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category") ?? "WEBSITE") as PinCategory,
      customCategory: String(form.get("customCategory") ?? "").trim(),
      imageUrl: String(form.get("imageUrl") ?? "").trim(),
      iconUrl: "",
      faviconUrl: "",
      isFavorite: form.get("isFavorite") === "on",
      isArchived: false,
      tags,
      sortOrder: pin?.sortOrder ?? 0
    };
    const saved = pin ? await updatePin(pin.id, payload) : await createPin(payload);
    router.push(`/pins/${saved.id}`);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-md border border-line bg-white p-5 shadow-soft">
      <section>
        <h3 className="mb-4 text-lg font-bold">Pin Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title"><Input name="title" required defaultValue={pin?.title} placeholder="Layer5 Website Repo" /></Field>
          <Field label="URL"><Input name="url" required defaultValue={pin?.url} placeholder="https://github.com/layer5io/layer5" /></Field>
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
        <h3 className="mb-4 text-lg font-bold">Description</h3>
        <Textarea name="description" defaultValue={pin?.description ?? ""} />
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="isFavorite" defaultChecked={pin?.isFavorite} className="h-4 w-4 rounded border-line" />
          Favorite
        </label>
        {faviconPreview ? <img src={faviconPreview} alt="" className="mt-4 h-10 w-10 rounded-md border border-line p-1" /> : null}
      </section>
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button href="/pins" variant="secondary">Cancel</Button>
        <Button type="button" onClick={() => formRef.current?.requestSubmit()}>{pin ? "Update pin" : "Create pin"}</Button>
      </div>
    </form>
  );
}
