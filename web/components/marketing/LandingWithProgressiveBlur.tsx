"use client";

import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export function LandingWithProgressiveBlur() {
  return (
    <div className="fixed inset-0">
      <iframe
        src="/index.html"
        title="Silene Systems"
        className="absolute inset-0 h-[100dvh] w-full border-0"
      />
      {/* Scroll cue: progressive blur at bottom (hidden when user prefers reduced motion) */}
      <div
        className="progressive-blur-landing pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[min(50vh,360px)]"
        aria-hidden
      >
        <div className="relative h-full w-full">
          <ProgressiveBlur height="50%" position="bottom" />
        </div>
      </div>
    </div>
  );
}
