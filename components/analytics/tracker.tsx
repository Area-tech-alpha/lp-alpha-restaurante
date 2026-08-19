"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventPayload = {
  type: string;
  data?: Record<string, unknown>;
  ts?: string;
};

type TrackerAPI = {
  sessionId: () => string | null;
  trackFieldFocus: (field: string) => void;
  trackFieldBlur: (field: string, filled: boolean) => void;
  trackValidationError: (fields: string[]) => void;
  trackSubmitAttempt: () => void;
  trackSubmitSuccess: (leadId: string, qualified: boolean) => void;
  markFormTouched: () => void;
};

declare global {
  interface Window {
    __tracker: TrackerAPI;
    fbq?: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_KEY = "alpha_sid";
const SCROLL_MILESTONES = [25, 50, 75, 90, 100];

function getDevice(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getUtms() {
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource: p.get("utm_source") ?? undefined,
    utmMedium: p.get("utm_medium") ?? undefined,
    utmCampaign: p.get("utm_campaign") ?? undefined,
    utmContent: p.get("utm_content") ?? undefined,
    utmTerm: p.get("utm_term") ?? undefined,
  };
}

function now() {
  return new Date().toISOString();
}

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(payload);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Tracker() {
  const sessionIdRef = useRef<string | null>(null);
  const pendingRef = useRef<EventPayload[]>([]);
  const formTouchedRef = useRef(false);
  const formSubmittedRef = useRef(false);
  const formOpenAtRef = useRef<number | null>(null);
  const filledFieldsRef = useRef<Set<string>>(new Set());
  const lastFieldRef = useRef<string | null>(null);
  const maxScrollRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const flushing = useRef(false);

  // -------------------------------------------------------------------------
  // Send helpers
  // -------------------------------------------------------------------------

  function send(events: EventPayload[]) {
    if (!sessionIdRef.current || events.length === 0) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current, events }),
    }).catch(() => {});
  }

  function queue(event: EventPayload) {
    if (sessionIdRef.current) {
      send([event]);
    } else {
      pendingRef.current.push(event);
    }
  }

  function flushPending() {
    if (flushing.current || pendingRef.current.length === 0) return;
    flushing.current = true;
    const toSend = pendingRef.current.splice(0);
    send(toSend);
    flushing.current = false;
  }

  function beacon(events: EventPayload[], extra?: Record<string, unknown>) {
    if (!sessionIdRef.current) return;
    const body = JSON.stringify({
      sessionId: sessionIdRef.current,
      events,
      ...extra,
    });
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  }

  // -------------------------------------------------------------------------
  // Session init
  // -------------------------------------------------------------------------

  useEffect(() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    const utms = getUtms();

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: existing ?? undefined,
        landingUrl: window.location.href,
        referrer: document.referrer || undefined,
        deviceType: getDevice(),
        ...utms,
      }),
    })
      .then((r) => r.json())
      .then(({ sessionId }: { sessionId: string }) => {
        sessionIdRef.current = sessionId;
        sessionStorage.setItem(SESSION_KEY, sessionId);

        if (!existing) {
          queue({ type: "session_start", data: { ...utms, device: getDevice() }, ts: now() });
          pushDataLayer({
            event: "session_start",
            device: getDevice(),
            utm_source: utms.utmSource,
            utm_medium: utms.utmMedium,
            utm_campaign: utms.utmCampaign,
          });
        }

        flushPending();
      })
      .catch(() => {});
  }, []);

  // -------------------------------------------------------------------------
  // Scroll depth
  // -------------------------------------------------------------------------

  useEffect(() => {
    const reached = new Set<number>();
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const el = document.documentElement;
        const scrolled = el.scrollTop + el.clientHeight;
        const total = el.scrollHeight;
        const percent = Math.round((scrolled / total) * 100);

        if (percent > maxScrollRef.current) maxScrollRef.current = percent;

        for (const milestone of SCROLL_MILESTONES) {
          if (!reached.has(milestone) && percent >= milestone) {
            reached.add(milestone);
            queue({ type: "scroll_depth", data: { percent: milestone }, ts: now() });
            if (milestone === 50 || milestone === 75) {
              pushDataLayer({ event: `scroll_${milestone}` });
            }
          }
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // -------------------------------------------------------------------------
  // Section visibility (IntersectionObserver)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = (entry.target as HTMLElement).dataset.section;
          if (section && !seen.has(section)) {
            seen.add(section);
            queue({ type: "section_view", data: { section }, ts: now() });
            if (section === "form") {
              queue({ type: "form_view", ts: now() });
              pushDataLayer({ event: "form_view" });
            }
          }
        }
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // -------------------------------------------------------------------------
  // CTA clicks (event delegation)
  // -------------------------------------------------------------------------

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("[data-cta]") as HTMLElement | null;
      if (!target) return;
      const ctaLabel = target.dataset.cta ?? target.textContent?.trim();
      const ctaSection = target.closest("[data-section]")
        ? (target.closest("[data-section]") as HTMLElement).dataset.section
        : undefined;
      queue({
        type: "cta_click",
        data: { label: ctaLabel, section: ctaSection },
        ts: now(),
      });
      pushDataLayer({ event: "cta_click", cta_label: ctaLabel, section: ctaSection });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // -------------------------------------------------------------------------
  // Abandonment + session end on page unload
  // -------------------------------------------------------------------------

  useEffect(() => {
    function onUnload() {
      const timeOnPageSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      const events: EventPayload[] = [];

      if (formTouchedRef.current && !formSubmittedRef.current) {
        const timeInFormSec = formOpenAtRef.current
          ? Math.round((Date.now() - formOpenAtRef.current) / 1000)
          : null;
        events.push({
          type: "form_abandon",
          data: {
            lastField: lastFieldRef.current,
            filledFields: [...filledFieldsRef.current],
            timeInFormSec,
          },
          ts: now(),
        });
        pushDataLayer({
          event: "form_abandon",
          last_field: lastFieldRef.current,
          filled_fields_count: filledFieldsRef.current.size,
        });
      }

      events.push({ type: "session_end", ts: now() });

      beacon(events, { maxScrollDepth: maxScrollRef.current, timeOnPageSec });
    }

    window.addEventListener("pagehide", onUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onUnload();
    });

    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  // -------------------------------------------------------------------------
  // Expose tracker API for LeadForm
  // -------------------------------------------------------------------------

  useEffect(() => {
    window.__tracker = {
      sessionId: () => sessionIdRef.current,

      markFormTouched: () => {
        if (!formTouchedRef.current) {
          formTouchedRef.current = true;
          formOpenAtRef.current = Date.now();
        }
      },

      trackFieldFocus: (field: string) => {
        window.__tracker.markFormTouched();
        lastFieldRef.current = field;
        queue({ type: "form_field_focus", data: { field }, ts: now() });
      },

      trackFieldBlur: (field: string, filled: boolean) => {
        if (filled) filledFieldsRef.current.add(field);
        else filledFieldsRef.current.delete(field);
        queue({ type: "form_field_blur", data: { field, filled }, ts: now() });
      },

      trackValidationError: (fields: string[]) => {
        queue({ type: "form_validation_error", data: { fields }, ts: now() });
      },

      trackSubmitAttempt: () => {
        queue({ type: "form_submit_attempt", ts: now() });
        pushDataLayer({ event: "form_submit_attempt" });
      },

      trackSubmitSuccess: (leadId: string, qualified: boolean) => {
        formSubmittedRef.current = true;
        queue({ type: "form_submit_success", data: { leadId, qualified }, ts: now() });
        pushDataLayer({ event: "lead", lead_id: leadId, qualified });
        window.fbq?.("track", "Lead", { qualified });
      },
    };
  }, []);

  return null;
}
