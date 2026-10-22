"use client";

import type { OrganizationContributorsResponse } from "@/types/explore";

export function ContributorSummary({ data }: { data: OrganizationContributorsResponse }) {
  const top = data.topContributor;
  const gradient = distributionGradient(data.distribution);
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Top Contributor</h3>
        {top ? (
          <div className="mt-5 flex items-center gap-4">
            {top.user.avatarUrl ? (
              <img src={top.user.avatarUrl} alt="" className="h-20 w-20 rounded-full border border-moss/30 object-cover" />
            ) : (
              <span className="grid h-20 w-20 rounded-full border border-moss/30 bg-moss/10 place-items-center text-2xl font-semibold text-moss">{top.user.name.slice(0, 1).toUpperCase()}</span>
            )}
            <div>
              <p className="font-semibold text-ink">{top.user.name}</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{top.totalContribution.toLocaleString()}</p>
              <p className="text-sm font-semibold text-muted">{top.contributionPercentage}% of total contributions</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-line bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Contribution distribution</h3>
        {data.distribution.length ? (
          <div className="mt-5 grid items-center gap-5 sm:grid-cols-[140px_1fr]">
            <div className="h-32 w-32 rounded-full" style={{ background: gradient }}>
              <div className="grid h-full w-full place-items-center rounded-full">
                <div className="h-16 w-16 rounded-full bg-panel" />
              </div>
            </div>
            <div className="space-y-3">
              {data.distribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-muted">{item.label}</span>
                  <span className="font-bold text-ink">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-muted">No contribution distribution available yet.</p>
        )}
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-muted">Total contributions</span>
            <span className="font-semibold text-ink">{data.totalContribution.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function distributionGradient(distribution: OrganizationContributorsResponse["distribution"]) {
  const colors = ["var(--ds-series-1)", "var(--ds-series-2)", "var(--ds-series-3)", "var(--ds-series-4)"];
  let cursor = 0;
  const stops = distribution.map((item, index) => {
    const start = cursor;
    cursor += item.percentage;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}
