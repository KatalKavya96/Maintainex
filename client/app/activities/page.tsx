import { ActivityFilters } from "@/components/activities/ActivityFilters";
import { ActivityTable } from "@/components/activities/ActivityTable";
import { PageTitle } from "@/components/common/PageTitle";

export default function ActivitiesPage() {
  return (
    <>
      <PageTitle
        title="Activities"
        description="Search, filter, review, edit, and open every tracked open-source maintenance activity."
      />
      <ActivityFilters />
      <ActivityTable />
    </>
  );
}
