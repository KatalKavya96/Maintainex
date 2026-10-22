"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { PinForm } from "@/features/pins/components/PinForm";
import { getPinById } from "@/data/api/pins";
import type { Pin } from "@/types/pin";

export default function EditPinPage({ params }: { params: { id: string } }) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getPinById(params.id).then(setPin).catch((err) => setError(err.message ?? "Pin not found"));
  }, [params.id]);
  if (error) return <div className="rounded-xl border border-danger bg-skyglass p-5 text-sm font-semibold text-danger">{error}</div>;
  if (!pin) return <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted shadow-soft">Loading pin...</div>;
  return (
    <>
      <PageTitle title="Edit Pin" description="Update this pinned contribution shortcut." />
      <PinForm pin={pin} />
    </>
  );
}
