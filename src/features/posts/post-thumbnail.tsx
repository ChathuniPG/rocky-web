"use client";

import Image from "next/image";
import { useState } from "react";

import { useInView } from "@/hooks/use-in-view";
import type { MediaType } from "@/lib/api/types";

type PostThumbnailProps = {
  mediaUrl: string;
  mediaType: MediaType;
  /** The `sizes` hint for next/image, matching how wide the thumbnail is drawn. */
  sizes: string;
  /** Load the image straight away (above the fold) instead of lazily. */
  eager?: boolean;
};

/**
 * A post's media as a decorative, cropped thumbnail that fills its positioned
 * parent: an image through next/image, or a video's still frame. Used by the
 * profile grid and the notifications list. Alt text is empty; the surrounding
 * link names what the thumbnail stands for.
 */
export function PostThumbnail({ mediaUrl, mediaType, sizes, eager = false }: PostThumbnailProps) {
  if (mediaType === "VIDEO") return <VideoStill src={mediaUrl} />;
  return (
    <Image
      src={mediaUrl}
      alt=""
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      className="object-cover"
    />
  );
}

/**
 * A video's first frame as a thumbnail. The <video> element is only created
 * once the thumbnail nears the viewport, and then only loads metadata and the
 * first frame (#t=0.1 makes browsers paint it), so a long list doesn't download
 * every video. It is muted, never plays and is hidden from assistive technology.
 */
function VideoStill({ src }: { src: string }) {
  const [isNear, setIsNear] = useState(false);
  const ref = useInView({
    onEnter: () => setIsNear(true),
    rootMargin: "400px 0px",
    enabled: !isNear,
  });

  return (
    <span ref={ref} className="absolute inset-0">
      {isNear ? (
        <video
          src={`${src}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none size-full object-cover"
        />
      ) : null}
    </span>
  );
}
