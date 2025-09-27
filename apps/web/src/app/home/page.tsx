import type { Metadata } from "next";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

export const metadata: Metadata = {
  title: "Shinobi Feed",
  description: "Browse the latest verified signals from the Shinobi community.",
};

export default function HomeFeedPage() {
  return <FeedPageClient />;
}
