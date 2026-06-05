import { ActivityForm } from "@/components/activities/ActivityForm";
import { PageTitle } from "@/components/common/PageTitle";

export default function NewActivityPage() {
  return (
    <>
      <PageTitle title="Add Activity" description="Capture the contribution details while the context is still fresh." />
      <ActivityForm />
    </>
  );
}
