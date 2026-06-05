import { PageTitle } from "@/components/common/PageTitle";
import { PinForm } from "@/components/pins/PinForm";

export default function NewPinPage() {
  return (
    <>
      <PageTitle title="Add Pin" description="Save a frequently used contribution link with category, tags, and favicon support." />
      <PinForm />
    </>
  );
}
