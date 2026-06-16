import { redirect } from "next/navigation";

export default function RecommendedPage() {
  redirect("/coming-soon?feature=recommended-for-you");
}
