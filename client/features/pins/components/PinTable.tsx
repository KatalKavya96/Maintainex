import Link from "next/link";
import { Badge, DataTable } from "@/design-system";
import { labelize } from "@/shared/lib/constants";
import type { Pin } from "@/types/pin";

export function PinTable({ pins }: { pins: Pin[] }) {
  return <DataTable label="Your contribution references" rows={pins} rowKey={pin=>pin.id} columns={[
    {id:"title",label:"Reference",render:pin=><Link href={`/pins/${pin.id}`} className="block min-w-[220px] max-w-lg"><span className="font-medium hover:text-moss">{pin.title}</span><p className="mt-1 line-clamp-1 text-xs text-muted">{pin.description || pin.url}</p></Link>},
    {id:"category",label:"Category",render:pin=><Badge>{labelize(pin.category)}</Badge>},
    {id:"tags",label:"Tags",render:pin=><span className="text-xs text-muted">{pin.tags.join(", ") || "—"}</span>},
    {id:"favorite",label:"Favorite",render:pin=><span className="text-xs text-muted">{pin.isFavorite ? "Yes" : "—"}</span>}
  ]} />;
}
