"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Eye, Flame, Heart, Loader2, MessageCircle, Send, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { ActivityBadge } from "@/features/activities";
import { Button } from "@/design-system/patterns/Button";

import { bookmarkActivity, commentOnActivity, deleteActivityComment, getActivityComments, reactToActivity, shareActivity, unbookmarkActivity, unreactToActivity } from "@/data/api/social";
import { formatDate } from "@/shared/lib/dateUtils";
import type { ActivityComment, ActivityEngagement, ActivityReactionType, FeedItem } from "@/types/social";

const reactionButtons: { type: ActivityReactionType; label: string; icon: typeof Heart }[] = [
  { type: "LIKE", label: "Like", icon: Heart },
  { type: "FIRE", label: "Great", icon: Flame },
  { type: "CLAP", label: "Nice", icon: ThumbsUp },
  { type: "EYES", label: "Useful", icon: Eye }
];

export function FeedCard({ item, onEngagementChange }: { item: FeedItem; onEngagementChange: (activityId: string, engagement: ActivityEngagement) => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const engagement = item.engagement;

  async function toggleReaction(type: ActivityReactionType) {
    setWorking(`reaction-${type}`);
    setMessage("");
    try {
      const next = engagement.viewerReactionTypes.includes(type)
        ? await unreactToActivity(item.activity.id, type)
        : await reactToActivity(item.activity.id, type);
      onEngagementChange(item.activity.id, next);
    } finally {
      setWorking("");
    }
  }

  async function toggleBookmark() {
    setWorking("bookmark");
    setMessage("");
    try {
      const next = engagement.viewerBookmarked ? await unbookmarkActivity(item.activity.id) : await bookmarkActivity(item.activity.id);
      onEngagementChange(item.activity.id, next);
    } finally {
      setWorking("");
    }
  }

  async function toggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    setMessage("");
    if (nextOpen && comments.length === 0) {
      setWorking("comments");
      try {
        const data = await getActivityComments(item.activity.id);
        setComments(data.comments);
        onEngagementChange(item.activity.id, data.engagement);
      } finally {
        setWorking("");
      }
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setWorking("comment");
    setMessage("");
    try {
      const created = await commentOnActivity(item.activity.id, commentText);
      setComments((current) => [...current, created]);
      setCommentText("");
      const data = await getActivityComments(item.activity.id);
      onEngagementChange(item.activity.id, data.engagement);
    } finally {
      setWorking("");
    }
  }

  async function removeComment(commentId: string) {
    setWorking(commentId);
    try {
      await deleteActivityComment(item.activity.id, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      const data = await getActivityComments(item.activity.id);
      onEngagementChange(item.activity.id, data.engagement);
    } finally {
      setWorking("");
    }
  }

  async function share() {
    setWorking("share");
    setMessage("");
    try {
      const data = await shareActivity(item.activity.id);
      onEngagementChange(item.activity.id, data.engagement);
      const url = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setMessage("Share link copied.");
    } finally {
      setWorking("");
    }
  }

  return (
    <article className="rounded-xl border border-line bg-panel p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Link href={`/profile/${item.user.username}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-semibold text-on-accent">
            {item.user.name.slice(0, 1).toUpperCase()}
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">
              <Link href={`/profile/${item.user.username}`} className="font-bold text-ink hover:text-moss">{item.user.name}</Link>{" "}
              contributed to{" "}
              <Link href={`/repos/${encodeURIComponent(item.activity.organizationName)}/${encodeURIComponent(item.activity.repositoryName)}`} className="font-bold text-ink hover:text-moss">
                {item.activity.organizationName}/{item.activity.repositoryName}
              </Link>
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">{formatDate(item.createdAt.slice(0, 10))}</p>
          </div>
        </div>
        <ActivityBadge value={item.activity.activityType} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{item.activity.title}</h3>
      {item.activity.description ? <p className="mt-2 rounded-lg bg-skyglass p-3 text-sm font-semibold leading-6 text-muted">{item.activity.description}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {reactionButtons.map((reaction) => {
          const Icon = reaction.icon;
          const active = engagement.viewerReactionTypes.includes(reaction.type);
          return (
            <button
              key={reaction.type}
              type="button"
              onClick={() => toggleReaction(reaction.type)}
              disabled={Boolean(working)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
                active ? "border-moss bg-moss text-on-accent" : "border-line bg-skyglass text-muted hover:border-moss hover:text-ink"
              }`}
              title={reaction.label}
            >
              {working === `reaction-${reaction.type}` ? <Loader2 className="animate-spin" size={14} /> : <Icon size={14} />}
              {engagement.reactionCounts[reaction.type] ?? 0}
            </button>
          );
        })}
        <button
          type="button"
          onClick={toggleComments}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-skyglass px-2.5 text-xs font-semibold text-muted transition hover:border-moss hover:text-ink"
        >
          <MessageCircle size={14} />
          {engagement.commentCount}
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          disabled={Boolean(working)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
            engagement.viewerBookmarked ? "border-moss bg-moss text-on-accent" : "border-line bg-skyglass text-muted hover:border-moss hover:text-ink"
          }`}
        >
          {working === "bookmark" ? <Loader2 className="animate-spin" size={14} /> : <Bookmark size={14} />}
          {engagement.bookmarkCount}
        </button>
        <button
          type="button"
          onClick={share}
          disabled={Boolean(working)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-skyglass px-2.5 text-xs font-semibold text-muted transition hover:border-moss hover:text-ink"
        >
          {working === "share" ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
          {engagement.shareCount}
        </button>
        {message ? <span className="text-xs font-bold text-moss">{message}</span> : null}
      </div>

      {commentsOpen ? (
        <div className="mt-3 rounded-lg border border-line bg-skyglass p-3">
          {working === "comments" ? (
            <p className="text-sm font-semibold text-muted">Loading comments...</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Link href={`/profile/${comment.user.username}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-moss text-xs font-semibold text-on-accent">
                    {comment.user.name.slice(0, 1).toUpperCase()}
                  </Link>
                  <div className="min-w-0 flex-1 rounded-lg bg-panel px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">@{comment.user.username}</p>
                      <button type="button" onClick={() => removeComment(comment.id)} className="text-muted hover:text-danger" title="Delete comment">
                        {working === comment.id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-5 text-muted">{comment.body}</p>
                  </div>
                </div>
              ))}
              {!comments.length ? <p className="text-sm font-semibold text-muted">No comments yet.</p> : null}
            </div>
          )}
          <form onSubmit={submitComment} className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a helpful comment..."
              className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 text-sm outline-none focus:border-moss"
            />
            <Button type="submit" disabled={working === "comment" || !commentText.trim()} className="shrink-0">
              {working === "comment" ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              Send
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

