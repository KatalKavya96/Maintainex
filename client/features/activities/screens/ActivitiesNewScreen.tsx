import { ActivityForm } from "@/features/activities/components/ActivityForm";
import { PageTitle } from "@/design-system/patterns/PageTitle";

export default function NewActivityPage() {
  return (
    <>
      <PageTitle title="Add Activity" description="Capture the contribution details while the context is still fresh." />
      <ActivityForm />
    </>
  );
}
