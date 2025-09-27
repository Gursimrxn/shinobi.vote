import type { Metadata } from "next";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

export const metadata: Metadata = {
  title: "GhostApp Feed",
  description: "Browse the latest verified signals from the GhostApp community.",
};

export default function HomeFeedPage() {
  return <FeedPageClient />;
}
