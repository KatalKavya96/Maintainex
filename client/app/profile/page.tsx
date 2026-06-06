"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { isReady, user } = useAuthStore();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(user.id === "viewer" ? "/coming-soon?feature=Viewer%20profile" : `/profile/${user.username}`);
  }, [isReady, router, user?.id, user?.username]);

  return (
    <main className="grid min-h-[45vh] place-items-center rounded-xl border border-line bg-white p-8 text-sm font-semibold text-slate-500 shadow-soft">
      Opening your profile...
    </main>
  );
}
