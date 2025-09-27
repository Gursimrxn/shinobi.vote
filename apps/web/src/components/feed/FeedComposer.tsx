"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  CalendarRange,
  Hash,
  ImagePlus,
  Link2,
  Smile,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedComposerProps {
  onSubmit?: (payload: { content: string }) => Promise<void> | void;
  isSubmitting?: boolean;
  placeholder?: string;
  prefill?: string | null;
  onPrefillConsumed?: () => void;
}

const MAX_CHARACTERS = 420;

export function FeedComposer({
  onSubmit,
  isSubmitting,
  placeholder = "What are you exploring today?",
  prefill,
  onPrefillConsumed,
}: FeedComposerProps) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!prefill) return;
    setContent((prev) => {
      const insertion = prev.length > 0 ? `${prev.trimEnd()} ${prefill}` : prefill;
      if (onPrefillConsumed) {
        onPrefillConsumed();
      }
      return insertion;
    });
  }, [prefill, onPrefillConsumed]);

  const charactersRemaining = MAX_CHARACTERS - content.length;
  const progress = useMemo(() => {
    const ratio = Math.min(1, content.length / MAX_CHARACTERS);
    return Math.round(ratio * 100);
  }, [content.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;
    await onSubmit?.({ content: content.trim() });
    setContent("");
  };

  const disabled = isSubmitting || content.trim().length === 0 || content.length > MAX_CHARACTERS;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-[28px] border border-[#1f1d2b]/10 bg-white/80 p-6 shadow-[0_24px_60px_-32px_rgba(31,29,43,0.35)] backdrop-blur-sm"
    >
      <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff6b35]/60 to-transparent" aria-hidden />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb347] via-[#ff6b35] to-[#6f4eb0] text-lg font-semibold text-white shadow-sm">
          ✶
        </div>
        <div className="flex-1 space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={placeholder}
            maxLength={MAX_CHARACTERS + 20}
            className="min-h-[120px] w-full resize-none rounded-3xl border border-transparent bg-white/70 px-5 py-4 text-base leading-relaxed text-black placeholder:text-black/40 outline-none focus:border-black/10 focus:ring-2 focus:ring-[#ff6b35]/20"
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-black/60">
              <ComposerAction icon={<ImagePlus className="h-4 w-4" />} label="Media" />
              <ComposerAction icon={<Hash className="h-4 w-4" />} label="Topic" />
              <ComposerAction icon={<AtSign className="h-4 w-4" />} label="Mention" />
              <ComposerAction icon={<Smile className="h-4 w-4" />} label="Mood" />
              <ComposerAction icon={<CalendarRange className="h-4 w-4" />} label="Schedule" />
              <ComposerAction icon={<Link2 className="h-4 w-4" />} label="Attachment" />
            </div>
            <div className="flex w-full items-center justify-end gap-3 md:w-auto">
              <div className="hidden items-center gap-2 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-black/50 sm:flex">
                <Sparkles className="h-3 w-3" />
                {progress}% crafted
              </div>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  charactersRemaining < 0
                    ? "text-red-500"
                    : charactersRemaining < 60
                    ? "text-[#ff6b35]"
                    : "text-black/40"
                )}
              >
                {charactersRemaining}
              </span>
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6f4eb0]/20 transition hover:scale-[1.02] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Broadcast
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

interface ComposerActionProps {
  icon: React.ReactNode;
  label: string;
}

function ComposerAction({ icon, label }: ComposerActionProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-3 py-1 text-xs font-medium text-black/60 transition hover:border-black/10 hover:text-black"
    >
      {icon}
      {label}
    </button>
  );
}
