"use client";
import { useParams } from "next/navigation";
import { FollowList } from "../components/FollowList";

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  return <FollowList username={username} kind="following" />;
}
