"use client";
import { useState } from "react";
import { Badge, Button, DataTable, EmptyState, Field, Input, Metric, PageHeader, Select, Surface, Textarea, Toolbar } from "@/design-system";
import inventory from "@/design-system/inventory.json";

/** Isolated examples. No API requests, account records or production metrics. */
export default function DesignSystemScreen() {
  const [filter,setFilter] = useState("");
  const [feedback,setFeedback] = useState("");
  const entries = inventory.components.filter(item=>`${item.id} ${item.name} ${item.owner} ${item.file}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="mx-auto max-w-6xl space-y-6"><PageHeader title="Design inventory" eyebrow="Maintainex / component reference" description="Live reusable components. Everything on this page is an isolated design example." />
    <Surface><h2 className="mb-4 text-lg font-semibold">Actions and feedback</h2><Toolbar label="Button variants"><Button onClick={()=>setFeedback("Primary action example selected")}>Primary</Button><Button variant="secondary" onClick={()=>setFeedback("Secondary action example selected")}>Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Destructive</Button><Button disabled>Disabled</Button></Toolbar><p role="status" className="mt-3 text-sm text-muted">{feedback || "Select a button to inspect its feedback."}</p></Surface>
    <div className="grid gap-6 md:grid-cols-2"><Surface><h2 className="mb-4 text-lg font-semibold">Form controls</h2><div className="space-y-4"><Field label="Example input" hint="Supporting instructions stay beside the field."><Input placeholder="Enter a value" /></Field><Field label="Example selection"><Select defaultValue="neutral"><option value="neutral">Neutral option</option><option value="alternate">Alternate option</option></Select></Field><Field label="Example notes"><Textarea placeholder="Write a note" /></Field><Field label="Invalid example" error="This is an example validation message."><Input aria-invalid="true" defaultValue="Invalid value" /></Field><Field label="Disabled example"><Input disabled placeholder="Unavailable" /></Field></div></Surface>
      <Surface><h2 className="mb-4 text-lg font-semibold">Status and structure</h2><Toolbar label="Badge tones"><Badge>Neutral</Badge><Badge tone="accent">Completed</Badge><Badge tone="danger">Error</Badge></Toolbar><div className="my-5"><Metric label="Example value" value="24" detail="Illustrative, not live workspace data" /></div><EmptyState title="Example empty state" description="An honest explanation and a useful next action." action={<Button variant="secondary">Example action</Button>} /></Surface></div>
    <Surface><h2 className="mb-3 text-lg font-semibold">Registered components</h2><Input aria-label="Filter component inventory" placeholder="Search ID, component, owner or source file" value={filter} onChange={e=>setFilter(e.target.value)} className="mb-4" />
      <p role="status" className="mb-3 text-xs text-muted">{entries.length} matching components</p>
      {!entries.length ? <EmptyState title="No matching components" description="Search a component name, stable ID, owner or source path." /> : <DataTable label="Component inventory" rows={entries} rowKey={row=>row.id} columns={[
        { id:"name",label:"Component",render:row=><div><span className="font-medium">{row.name}</span><p className="mt-1 font-mono text-xs text-muted">{row.id}</p></div> },
        { id:"owner",label:"Owner",render:row=>row.owner },
        { id:"variants",label:"Variants",render:row=>row.variants.join(", ") },
        { id:"file",label:"Contract",render:row=><details><summary className="cursor-pointer text-sm">Revision {row.revision} · details</summary><div className="mt-2 space-y-2 text-xs text-muted"><code>{row.file}</code><p>States: {row.states.join(", ")}</p><p>{row.review}</p><p>{row.usedBy.length} direct source consumers</p></div></details> }
      ]} />}
    </Surface>
  </div>;
}
