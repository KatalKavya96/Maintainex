"use client";

import { ExternalLink, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { labelize } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import { useActivityStore } from "@/lib/activityStore";

export function ActivityTable() {
  const { activities, deleteActivity } = useActivityStore();

  if (activities.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-lg font-bold">No activities yet</p>
        <p className="mt-2 text-sm text-slate-500">Add your first maintenance activity to populate this table.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Repository</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Closing Reason</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 text-slate-600">{formatDate(activity.date)}</td>
                <td className="px-4 py-3">
                  <ActivityBadge value={activity.activityType} />
                </td>
                <td className="px-4 py-3 font-medium">{activity.organizationName}</td>
                <td className="px-4 py-3">{activity.repositoryName}</td>
                <td className="px-4 py-3 text-slate-600">{activity.number}</td>
                <td className="max-w-[280px] truncate px-4 py-3">{activity.title}</td>
                <td className="px-4 py-3">{labelize(activity.status)}</td>
                <td className="px-4 py-3 text-slate-600">{labelize(activity.closingReason)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link className="rounded-md p-2 hover:bg-slate-100" href={`/activities/${activity.id}`} title="View">
                      <Eye size={16} />
                    </Link>
                    <Link className="rounded-md p-2 hover:bg-slate-100" href={`/activities/${activity.id}/edit`} title="Edit">
                      <Pencil size={16} />
                    </Link>
                    {activity.link ? (
                      <a className="rounded-md p-2 hover:bg-slate-100" href={activity.link} target="_blank" title="Open GitHub">
                        <ExternalLink size={16} />
                      </a>
                    ) : null}
                    <button
                      className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                      title="Delete"
                      onClick={() => void deleteActivity(activity.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
