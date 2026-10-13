"use client";

import { useEffect } from "react";
import { clarityEvent, claritySet, clarityUpgrade } from "@/lib/clarity";

export function PageEvent({
  event,
  tags,
}: {
  event: string;
  tags?: Record<string, string>;
}) {
  useEffect(() => {
    clarityEvent(event);
    for (const [key, value] of Object.entries(tags ?? {})) claritySet(key, value);
    clarityUpgrade(event);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
