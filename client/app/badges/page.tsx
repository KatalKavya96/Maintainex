"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BadgesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return <main className="grid min-h-[50vh] place-items-center text-sm font-semibold text-slate-500">Opening Home...</main>;
}
