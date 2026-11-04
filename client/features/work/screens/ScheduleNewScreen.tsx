"use client";
import { useEffect, useState } from "react";
import { AsyncState, PageHeader } from "@/design-system";
import { ScheduledWorkForm } from "../components/ScheduledWorkForm";
import { getPinById } from "@/data/api/pins";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function NewScheduledWorkPage() {
  const [seed, setSeed] = useState<Partial<ScheduledWork>>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(()=>{
    let current = true;
    const pinId = new URLSearchParams(window.location.search).get("pinId");
    setFailed(false);
    if (!pinId) { setLoading(false); return; }
    setLoading(true);
    getPinById(pinId).then(pin=>{
      let repository: Partial<ScheduledWork> = {};
      try { const url = new URL(pin.url); const parts = url.pathname.split("/").filter(Boolean); if(url.hostname === "github.com" && parts.length >= 2) repository = {organizationName:parts[0],repositoryName:parts[1]}; } catch { /* Keep repository fields empty for non-GitHub references. */ }
      if(current) setSeed({title:pin.title,itemUrl:pin.url,context:pin.description || pin.url,...repository});
    }).catch(()=>{if(current)setFailed(true);}).finally(()=>{if(current)setLoading(false);});
    return ()=>{current=false;};
  },[revision]);
  return <><PageHeader title="Plan work" description="Keep the next action clear. Add dates and supporting context as needed." /><AsyncState state={loading ? "loading" : failed ? "error" : "ready"} onRetry={()=>setRevision(value=>value+1)}><ScheduledWorkForm seed={seed} /></AsyncState></>;
}
