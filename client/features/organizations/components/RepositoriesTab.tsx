"use client";

import { EmptyState } from "@/design-system/patterns/MetricCard";

import { RepositoryCard } from "@/features/organizations/components/RepositoryCard";

import type { OrganizationRepositoriesResponse } from "@/types/explore";

export function RepositoriesTab({ repositories, orgSlug }: { repositories: OrganizationRepositoriesResponse["items"]; orgSlug: string }) {
  if (!repositories.length) return <EmptyState title="No repositories synced yet." description="Repository cards will appear after GitHub repository data is stored in Maintainex." />;
  return (
    <div className="grid gap-5 xl:grid-cols-2 min-[1800px]:grid-cols-3">
      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} orgSlug={orgSlug} />
      ))}
    </div>
  );
}
