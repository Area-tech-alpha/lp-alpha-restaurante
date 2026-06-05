"use client";

import { useEffect } from "react";

export function PageEvent({
  event,
  data,
}: {
  event: string;
  data?: Record<string, unknown>;
}) {
  useEffect(() => {
    const w = window as Window & { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event, ...data });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
