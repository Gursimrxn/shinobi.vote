"use client";

import { Loader2, Radar, Wand2 } from "lucide-react";
import { PostCard, type PostWithUrls } from "@/components/feed/PostCard";

interface FeedTimelineProps {
  posts: PostWithUrls[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function FeedTimeline({ posts, isLoading, isLoadingMore, hasMore, onLoadMore }: FeedTimelineProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <FeedSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#6f4eb0]/30 bg-white/70 p-12 text-center text-black/60">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#6f4eb0]/10 text-[#6f4eb0]">
          <Wand2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-black">Your feed is warming up</h3>
        <p className="mt-2 max-w-sm text-sm text-black/50">
          Follow a few creators or share something extraordinary to spark the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-6 py-2 text-sm font-semibold text-black/70 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            {isLoadingMore ? "Fetching signals" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4 rounded-[28px] border border-black/5 bg-white/60 p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-black/10" />
        <div className="flex-1 space-y-4">
          <div className="h-4 w-48 animate-pulse rounded-full bg-black/10" />
          <div className="h-4 w-full animate-pulse rounded-full bg-black/10" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-black/10" />
          <div className="h-48 w-full animate-pulse rounded-3xl bg-black/10" />
        </div>
      </div>
    </div>
  );
}
