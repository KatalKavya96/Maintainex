"use client";
import { useEffect, useState } from "react";
import { getActivity } from "@/data/api/activities";
import { ApiRequestError } from "@/data/http";
import type { Activity } from "@/types/activity";

/** Direct URLs resolve the owned record independently of list pagination. */
export function useActivityRecord(id: string) {
  const [record, setRecord] = useState<{ id: string; activity: Activity | null } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setRecord(null);
    getActivity(id).then(activity => { if (active) setRecord({ id, activity }); })
      .catch(reason => {
        if (!active) return;
        if (reason instanceof ApiRequestError && reason.status === 404) setRecord({ id, activity: null });
        else setError(reason instanceof Error ? reason.message : "Unable to load activity.");
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, revision]);
  return { activity: record?.id === id ? record.activity : null, error,
    loading: loading || (!error && record?.id !== id), retry: () => setRevision(value => value + 1) };
}
