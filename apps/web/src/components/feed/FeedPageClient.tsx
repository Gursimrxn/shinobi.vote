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
  const [openSidebar, setOpenSidebar] = useState(true);
  const [shouldAnimateSidebar, setShouldAnimateSidebar] = useState(false);
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
    if (typeof window === "undefined") {
      loadFeed(1, true).catch((err) => {
        console.error("Initial feed load failed", err);
      });
      return;
    }

    const syncViewportState = () => {
      const width = window.innerWidth;
      setShouldAnimateSidebar(width >= 1280);
      if (width < 1024) {
        setOpenSidebar(false);
      } else if (width >= 1280) {
        setOpenSidebar(true);
      }
    };

    syncViewportState();
    loadFeed(1, true).catch((err) => {
      console.error("Initial feed load failed", err);
    });

    window.addEventListener("resize", syncViewportState);
    return () => {
      window.removeEventListener("resize", syncViewportState);
    };
  }, [loadFeed]);

  const heroMessage = useMemo(() => {
    if (posts.length === 0) {
      return "Broadcast your first anchor to wake the feed.";
    }
    const newest = posts[0];
    const authorAlias = newest.author.slice(0, 6);
    return `Latest verified signal by ${authorAlias}…`;
  }, [posts]);

  const heroStats = useMemo(() => {
    if (!posts.length) {
      return [
        { label: "Anchors ready", value: "—" },
        { label: "Verified voices", value: "—" },
        { label: "Stored assets", value: "—" },
      ];
    }

    const uniqueAuthors = new Set(posts.map((post) => post.author)).size;
    const assetCount = posts.reduce((total, post) => total + (post.assets?.length ?? 0), 0);
    return [
      { label: "Anchors live", value: posts.length.toString().padStart(2, "0") },
      { label: "Verified voices", value: uniqueAuthors.toString().padStart(2, "0") },
      { label: "Stored assets", value: assetCount.toString().padStart(2, "0") },
    ];
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,_rgba(111,78,176,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[520px] bg-[radial-gradient(circle_at_70%_40%,rgba(255,107,53,0.1),transparent_70%)]" />
  <div className="relative mx-auto flex w-full max-w-[1420px] flex-col gap-8 px-5 pt-10 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-9 xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:px-10">
        <div className="lg:sticky lg:top-8">
          <Sidebar open={openSidebar} setOpen={setOpenSidebar} animate={shouldAnimateSidebar}>
            <SidebarBody className="justify-between rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_24px_70px_-40px_rgba(22,20,31,0.55)] backdrop-blur">
              <div className="flex flex-col gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-base font-semibold text-black">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] text-sm text-white">
                      ☼
                    </span>
                    Ghost Feed
                  </div>
                  <p className="text-xs text-black/50">
                    Anchor your ideas. Verify your people. Signal with purpose.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {navLinks.map((link) => (
                    <SidebarLink key={link.label} link={link} />
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-[#f6f1ff]/90 p-4 text-xs text-black/60">
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-[#6f4eb0]/60 to-[#ff6b35]/40" />
                <div className="relative mb-2 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6f4eb0]">
                  <ShieldCheck className="h-3 w-3" />
                  Proof mode
                </div>
                <p className="relative leading-relaxed">
                  Keep your verification streak by logging in at least once a week. Earn badges for holding the signal.
                </p>
              </div>
            </SidebarBody>
          </Sidebar>
        </div>

        <main className="flex min-w-0 flex-1 flex-col gap-7">
          <div className="relative overflow-hidden rounded-[32px] border border-black/5 bg-gradient-to-br from-white/90 via-white/75 to-[#f6f1ff]/90 p-6 shadow-[0_28px_80px_-40px_rgba(22,20,31,0.55)] sm:p-7">
            <div className="pointer-events-none absolute -left-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ff6b35]/35 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -bottom-12 h-44 w-44 rounded-full bg-gradient-to-br from-[#6f4eb0]/25 to-transparent" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f4eb0]">
                  <Sparkles className="h-3 w-3" />
                  Live feed
                </div>
                <h1 className="max-w-xl text-[26px] font-semibold leading-tight text-black md:text-[36px]">
                  {heroMessage}
                </h1>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <div className="grid w-full max-w-sm grid-cols-1 gap-3 rounded-2xl border border-white/40 bg-white/70 p-4 backdrop-blur-sm sm:grid-cols-3 sm:gap-4">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-xl font-semibold text-black">{stat.value}</span>
                    <span className="text-[11px] uppercase tracking-wide text-black/45">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="space-y-5">
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
          </section>
        </main>

        <div className={cn("hidden w-full max-w-sm flex-shrink-0 xl:block")}> 
          <div className="sticky top-10 space-y-5">
            <div className="rounded-[28px] border border-black/5 bg-white/75 p-6 shadow-[0_24px_60px_-35px_rgba(22,20,31,0.5)] backdrop-blur">
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
                  Safety pulse
                </h2>
                <p className="text-sm text-black/60">
                  Moderators are on duty. Report suspect anchors to keep the network healthy.
                </p>
              </div>
            </div>
            <RightRail onSelectTopic={(topic) => setComposerPrefill(topic)} />
          </div>
        </div>
      </div>
    </div>
  );
}
