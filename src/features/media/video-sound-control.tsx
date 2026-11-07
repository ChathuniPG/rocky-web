"use client";

import { Volume1Icon, Volume2Icon, VolumeXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { VOLUME_STEP } from "./video-preferences";

type VideoSoundControlProps = {
  muted: boolean;
  /** 0 to 1. */
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
};

/**
 * The player's sound control in the top-left corner (FR-FEED-09): a
 * mute/unmute button, and a volume slider that slides out on hover and on
 * keyboard focus. The slider is only narrowed, never hidden, so Tab still
 * reaches it, and focusing it opens it. A translucent dark pill keeps the
 * white icon visible on any video, in either theme.
 */
export function VideoSoundControl({
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  className,
}: VideoSoundControlProps) {
  const t = useTranslations();
  const silent = muted || volume === 0;
  const shownVolume = silent ? 0 : volume;
  const Icon = silent ? VolumeXIcon : volume < 0.5 ? Volume1Icon : Volume2Icon;

  return (
    <div
      className={cn(
        "group/sound absolute flex items-center rounded-full bg-black/55 text-white",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={silent ? t("post.video.unmute") : t("post.video.mute")}
        onClick={onToggleMute}
        className="rounded-full text-white hover:bg-black/40 hover:text-white focus-visible:ring-white active:bg-black/60"
      >
        <Icon aria-hidden="true" />
      </Button>
      <div className="w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 group-focus-within/sound:w-24 group-focus-within/sound:opacity-100 group-hover/sound:w-24 group-hover/sound:opacity-100 motion-reduce:transition-none">
        <Slider
          min={0}
          max={1}
          step={VOLUME_STEP}
          value={[shownVolume]}
          onValueChange={([next]) => {
            if (next !== undefined) onVolumeChange(next);
          }}
          className="h-9 w-24 cursor-pointer px-3"
          trackClassName="bg-white/35"
          rangeClassName="bg-white"
          thumbClassName="border-0 bg-white ring-white/60"
          thumbProps={{
            "aria-label": t("post.video.volume"),
            "aria-valuetext": t("post.video.volumeValue", {
              percent: Math.round(shownVolume * 100),
            }),
          }}
        />
      </div>
    </div>
  );
}
