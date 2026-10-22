import { PageTitle } from "@/design-system/patterns/PageTitle";
import { ScheduledWorkForm } from "@/features/work/components/ScheduledWorkForm";

export default function NewScheduledWorkPage() {
  return (
    <>
      <PageTitle title="Add Future Work" description="Schedule a PR review, issue, PR to raise, bug fix, or documentation task." />
      <ScheduledWorkForm />
    </>
  );
}
