import { ComingSoon } from "@/components/common/ComingSoon";

const labelFromFeature = (feature?: string) => {
  if (!feature) return "This feature";
  return decodeURIComponent(feature)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function ComingSoonPage({ searchParams }: { searchParams: { feature?: string } }) {
  const featureName = labelFromFeature(searchParams.feature);
  return <ComingSoon featureName={featureName} />;
}
