import { PageTitle } from "@/components/common/PageTitle";
import { ScheduledWorkForm } from "@/components/schedule/ScheduledWorkForm";

export default function NewScheduledWorkPage() {
  return (
    <>
      <PageTitle title="Add Future Work" description="Schedule a PR review, issue, PR to raise, bug fix, or documentation task." />
      <ScheduledWorkForm />
    </>
  );
}
