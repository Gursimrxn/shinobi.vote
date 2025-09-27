"use client";

import Image from "next/image";
import { Bookmark, Flame, Globe2, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post, PostAsset } from "@/types";

export type PostWithUrls = Post & {
  assets: Array<
    PostAsset & {
      urls?: {
        ipfs?: string;
        gateway?: string;
      };
    }
  >;
};

interface PostCardProps {
  post: PostWithUrls;
}

export function PostCard({ post }: PostCardProps) {
  type AugmentedAsset = PostWithUrls["assets"][number];
  const assets = post.assets as AugmentedAsset[];

  const imageAssets = assets.filter((asset) => asset.type === "image");
  const videoAssets = assets.filter((asset) => asset.type === "video");
  const documentAssets = assets.filter((asset) => asset.type === "document");

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(22,20,31,0.45)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-40px_rgba(22,20,31,0.55)]">
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#6f4eb0] to-transparent opacity-60" aria-hidden />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] text-base font-semibold text-white shadow-lg shadow-[#6f4eb0]/30">
          {post.author.slice(2, 4).toUpperCase()}
        </div>
        <div className="flex-1 space-y-4">
          <header className="flex flex-wrap items-center gap-2 text-sm text-black/60">
            <span className="font-semibold text-black">{shortenAddress(post.author)}</span>
            <span className="text-black/30">•</span>
            <span>{formatRelativeTime(post.timestamp)}</span>
            <span className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs uppercase tracking-wide text-black/40">
              <Globe2 className="h-3 w-3" />
              public
            </span>
          </header>

          {post.metadata?.title && (
            <h3 className="text-lg font-semibold text-black">
              {post.metadata.title}
            </h3>
          )}

          {post.text && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-black/80">
              {post.text}
            </p>
          )}

          {post.metadata?.tags && post.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f6f2ff] px-3 py-1 text-xs font-medium text-[#6f4eb0]"
                >
                  <Flame className="h-3 w-3" />
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {imageAssets.length > 0 && (
            <div
              className={cn(
                "overflow-hidden rounded-3xl border border-black/5",
                imageAssets.length === 1
                  ? "grid"
                  : "grid gap-2 sm:grid-cols-2"
              )}
            >
              {imageAssets.map((asset) => {
                const src =
                  asset.urls?.gateway ||
                  asset.urls?.ipfs ||
                  `https://gateway.lighthouse.storage/ipfs/${asset.cid}`;
                return (
                  <div
                    key={asset.cid}
                    className="relative min-h-[220px] overflow-hidden"
                  >
                    <Image
                      src={src}
                      alt={asset.filename || "Post media"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {videoAssets.length > 0 && (
            <div className="space-y-3">
              {videoAssets.map((asset) => (
                <video
                  key={asset.cid}
                  controls
                  className="w-full overflow-hidden rounded-3xl border border-black/5"
                >
                  <source
                    src={asset.urls?.gateway || asset.urls?.ipfs || `https://gateway.lighthouse.storage/ipfs/${asset.cid}`}
                    type={asset.mimeType || "video/mp4"}
                  />
                </video>
              ))}
            </div>
          )}

          {documentAssets.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              {documentAssets.map((asset) => (
                <a
                  key={asset.cid}
                  href={asset.urls?.gateway || asset.urls?.ipfs || `https://gateway.lighthouse.storage/ipfs/${asset.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-black/5 bg-black/5 px-4 py-3 text-black/70 transition hover:bg-black/10"
                >
                  <span className="truncate font-medium">{asset.filename ?? asset.cid}</span>
                  <Share2 className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-4 text-sm text-black/50">
            <ActionButton icon={<MessageCircle className="h-4 w-4" />} label="Reply" />
            <ActionButton icon={<Repeat2 className="h-4 w-4" />} label="Repost" />
            <ActionButton icon={<Share2 className="h-4 w-4" />} label="Share" />
            <ActionButton icon={<Bookmark className="h-4 w-4" />} label="Save" />
          </footer>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-black/50 transition hover:border-black/10 hover:text-black"
    >
      {icon}
      {label}
    </button>
  );
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.round(diff / 1000);

  const intervals: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let count = seconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const [threshold, nextUnit] of intervals) {
    if (Math.abs(count) < threshold) {
      unit = nextUnit;
      break;
    }
    count = Math.round(count / threshold);
    unit = nextUnit;
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(-count, unit);
}
