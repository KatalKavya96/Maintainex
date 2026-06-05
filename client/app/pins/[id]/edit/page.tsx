"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { PinForm } from "@/components/pins/PinForm";
import { getPinById } from "@/lib/api";
import type { Pin } from "@/types/pin";

export default function EditPinPage({ params }: { params: { id: string } }) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getPinById(params.id).then(setPin).catch((err) => setError(err.message ?? "Pin not found"));
  }, [params.id]);
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!pin) return <div className="rounded-md border border-line bg-white p-5 text-sm text-slate-500 shadow-soft">Loading pin...</div>;
  return (
    <>
      <PageTitle title="Edit Pin" description="Update this pinned contribution shortcut." />
      <PinForm pin={pin} />
    </>
  );
}
