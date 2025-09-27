"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flame, Sparkle, UserPlus2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RightRailProps {
  onSelectTopic?: (topic: string) => void;
}

const trendingTopics: Array<{
  title: string;
  subtitle: string;
  delta: string;
  tone: "signal" | "warm" | "cool";
}> = [
  {
    title: "#ProofOfSelf",
    subtitle: "Identity anchor wave",
    delta: "+128%",
    tone: "signal"
  },
  {
    title: "#OnChainJournals",
    subtitle: "Creators logging forever",
    delta: "+64%",
    tone: "warm"
  },
  {
    title: "#GhostSpaces",
    subtitle: "Live learning labs",
    delta: "+31%",
    tone: "cool"
  },
];

const suggestedCreators = [
  {
    name: "Amina K",
    handle: "@amina.eth",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    bio: "behavioral scientist decoding community trust",
  },
  {
    name: "Orbit Labs",
    handle: "@orbitlabs",
    avatar: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=200&auto=format&fit=crop&q=80",
    bio: "modular research team shipping open tools",
  },
  {
    name: "Leo Park",
    handle: "@leopark",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bio: "community architect, hosts weekly signal salons",
  },
];

export function RightRail({ onSelectTopic }: RightRailProps) {
  return (
    <aside className="sticky top-24 space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(31,29,43,0.55)]">
        <div className="flex items-center justify-between text-sm text-black/50">
          <div className="flex items-center gap-2 font-semibold text-black">
            <Sparkle className="h-4 w-4 text-[#ff6b35]" />
            Trending signals
          </div>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            live
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {trendingTopics.map((topic) => (
            <button
              key={topic.title}
              type="button"
              onClick={() => onSelectTopic?.(topic.title)}
              className={cn(
                "w-full rounded-2xl border border-transparent px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-black/10",
                toneStyles(topic.tone)
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">{topic.title}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-[#ff6b35]">
                  <Flame className="h-3 w-3" />
                  {topic.delta}
                </span>
              </div>
              <p className="mt-1 text-xs text-black/50">{topic.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/75 p-6 shadow-[0_18px_60px_-32px_rgba(31,29,43,0.4)]">
        <div className="flex items-center justify-between text-sm font-semibold text-black">
          Radar picks
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6f4eb0] transition hover:text-[#5c3ca0]"
          >
            see all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {suggestedCreators.map((creator) => (
            <div key={creator.handle} className="flex items-start gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={creator.avatar}
                  alt={creator.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black">{creator.name}</p>
                    <p className="text-xs text-black/50">{creator.handle}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#6f4eb0] transition hover:-translate-y-0.5 hover:border-[#6f4eb0]/40 hover:text-[#5a39a5]"
                  >
                    <UserPlus2 className="h-3 w-3" />
                    Follow
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-black/60">{creator.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function toneStyles(tone: "signal" | "warm" | "cool") {
  switch (tone) {
    case "signal":
      return "bg-[#f7f3ff]";
    case "warm":
      return "bg-[#fff4ed]";
    case "cool":
      return "bg-[#f1f5ff]";
    default:
      return "bg-white";
  }
}
