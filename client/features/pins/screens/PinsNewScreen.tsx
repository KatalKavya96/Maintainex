import { PageTitle } from "@/design-system/patterns/PageTitle";
import { PinForm } from "@/features/pins/components/PinForm";

export default function NewPinPage() {
  return (
    <>
      <PageTitle title="Add Pin" description="Save a useful reference with enough context to find it again." />
      <PinForm />
    </>
  );
}
