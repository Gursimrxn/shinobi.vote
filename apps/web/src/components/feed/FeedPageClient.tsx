"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  Compass,
  Home as HomeIcon,
  Inbox,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedTimeline } from "@/components/feed/FeedTimeline";
import { RightRail } from "@/components/feed/RightRail";
import type { PostAsset, Post } from "@/types";
import { cn } from "@/lib/utils";

export type FeedPost = Post & {
  assets: Array<
    PostAsset & {
      urls?: {
        ipfs?: string;
        gateway?: string;
      };
    }
  >;
};

interface FeedResponsePayload {
  posts: FeedPost[];
  total: number;
  page?: number;
  limit?: number;
}

const navLinks = [
  {
    label: "Home",
    href: "/home",
    icon: <HomeIcon className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Discover",
    href: "#discover",
    icon: <Compass className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Signals",
    href: "#signals",
    icon: <Sparkles className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Mentions",
    href: "#mentions",
    icon: <Inbox className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Alerts",
    href: "#alerts",
    icon: <Bell className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Bookmarks",
    href: "#bookmarks",
    icon: <Bookmark className="h-5 w-5 text-black/70" />,
  },
  {
    label: "Experiments",
    href: "#experiments",
    icon: <Layers className="h-5 w-5 text-black/70" />,
  },
];

export function FeedPageClient() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerPrefill, setComposerPrefill] = useState<string | null>(null);

  const limit = 6;

  const loadFeed = useCallback(
    async (pageToLoad: number, replace = false) => {
      try {
        if (replace) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const response = await fetch(`/api/feed?page=${pageToLoad}&limit=${limit}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Feed request failed with status ${response.status}`);
        }

        const payload: FeedResponsePayload = await response.json();

        setPosts((prev) => (replace ? payload.posts : [...prev, ...payload.posts]));
        setHasMore(payload.total > pageToLoad * limit);
        setPage(pageToLoad);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load feed");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    loadFeed(1, true).catch((err) => {
      console.error("Initial feed load failed", err);
    });
  }, [loadFeed]);

  const heroMessage = useMemo(() => {
    if (posts.length === 0) {
      return "Broadcast your first anchor to wake the feed.";
    }
    const newest = posts[0];
    const authorAlias = newest.author.slice(0, 6);
    return `Latest verified signal by ${authorAlias}…`;
  }, [posts]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    loadFeed(nextPage).catch((err) => {
      console.error("Load more failed", err);
    });
  }, [page, loadFeed]);

  const handleComposerSubmit = useCallback(async (payload: { content: string }) => {
    console.info("Composer submit payload", payload);
    // Hook into post creation endpoint when ready
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FFFCF4] pb-16 text-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#f7e6d5] via-transparent to-transparent" />
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pt-10 md:flex-row md:px-8 lg:px-12">
        <Sidebar open={openSidebar} setOpen={setOpenSidebar}>
          <SidebarBody className="justify-between rounded-3xl border border-black/5 bg-white/80 shadow-[0_30px_80px_-40px_rgba(22,20,31,0.35)]">
            <div className="flex flex-col gap-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-lg font-semibold text-black">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] text-white">
                    ☼
                  </span>
                  Ghost Feed
                </div>
                <p className="text-sm text-black/50">Anchor your ideas. Verify your people. Signal with purpose.</p>
              </div>
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <SidebarLink key={link.label} link={link} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#f6f1ff] p-4 text-sm text-black/60">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#6f4eb0]">
                <ShieldCheck className="h-3 w-3" />
                Proof mode
              </div>
              Keep your verification streak by logging in at least once a week.
            </div>
          </SidebarBody>
        </Sidebar>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="rounded-[32px] border border-black/5 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(22,20,31,0.55)]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6f4eb0]">
                <Sparkles className="h-4 w-4" />
                Live feed
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
                {heroMessage}
              </h1>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <FeedComposer
            onSubmit={handleComposerSubmit}
            isSubmitting={false}
            prefill={composerPrefill}
            onPrefillConsumed={() => setComposerPrefill(null)}
          />

          <FeedTimeline
            posts={posts}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </main>

        <div className={cn("hidden w-full max-w-sm flex-shrink-0 lg:block")}>
          <RightRail onSelectTopic={(topic) => setComposerPrefill(topic)} />
        </div>
      </div>
    </div>
  );
}
