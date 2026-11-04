"use client";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { GoalPanel } from "../components/GoalPanel";

export default function GoalsPage() {
  return <><PageTitle title="Goals" description="Manage your contribution targets." /><GoalPanel limit={null} /></>;
}
