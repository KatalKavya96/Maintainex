import { PageTitle } from "@/design-system/patterns/PageTitle";
import { PinForm } from "@/features/pins/components/PinForm";

export default function NewPinPage() {
  return (
    <>
      <PageTitle title="Add Pin" description="Save a frequently used contribution link with category, tags, and favicon support." />
      <PinForm />
    </>
  );
}
