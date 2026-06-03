"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function PixelEvent({ event }: { event: string }) {
  useEffect(() => {
    window.fbq?.("track", event);
  }, [event]);
  return null;
}
