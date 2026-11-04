"use client";
import { useParams } from "next/navigation";
import { FollowList } from "../components/FollowList";

export default function FollowersPage() {
  const { username } = useParams<{ username: string }>();
  return <FollowList username={username} kind="followers" />;
}
