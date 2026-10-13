"use client";

import { useEffect, type RefObject } from "react";
import { clarityEvent, claritySet, clarityUpgrade } from "@/lib/clarity";

const MILESTONES = [25, 50, 75];
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;

// Uma tag do Clarity guarda um único valor por chave; acumulamos entre os
// players da página para a tag refletir todos os vídeos vistos.
const watchedVideos = new Set<string>();
let maxPercentOnPage = 0;

// Parâmetros que habilitam o protocolo postMessage do player (sem carregar o
// script iframe_api do YouTube). Só chamar no client.
export function youtubeTrackingParams() {
  return `enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
}

type PlayerMessage = {
  event?: string;
  info?: number | { playerState?: number; currentTime?: number; duration?: number } | null;
};

/**
 * O Clarity não grava o conteúdo de iframes de outro domínio, então lemos o
 * estado do player e registramos play/progresso/conclusão como eventos no
 * Clarity e no /api/track. O progresso usa tempo realmente assistido (relógio
 * enquanto toca), não a posição do vídeo — pular para o fim não conta.
 */
export function useYoutubeTracking(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  videoId: string,
  active: boolean,
) {
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!active || !iframe) return;

    let connected = false;
    let state: number | null = null;
    let duration = 0;
    let playingSince: number | null = null;
    let watchedMs = 0;
    let reportedSec = 0;
    const reached = new Set<number>();

    const track = (type: string, data: Record<string, unknown> = {}) =>
      window.__tracker?.trackVideo(type, { videoId, ...data });

    const watchedSec = () =>
      (watchedMs + (playingSince !== null ? Date.now() - playingSince : 0)) / 1000;

    const watchedPercent = () =>
      duration ? Math.min(100, Math.round((watchedSec() / duration) * 100)) : 0;

    function reportWatchTime() {
      const seconds = Math.round(watchedSec());
      if (seconds <= reportedSec) return;
      reportedSec = seconds;
      track("video_watch_time", { seconds, percent: watchedPercent() });
    }

    function checkMilestones() {
      const percent = watchedPercent();
      for (const m of MILESTONES) {
        if (percent < m || reached.has(m)) continue;
        reached.add(m);
        clarityEvent(`video_${m}`);
        track("video_progress", { percent: m });
        if (m > maxPercentOnPage) {
          maxPercentOnPage = m;
          claritySet("video_max_pct", String(m));
        }
      }
    }

    function setState(next: number) {
      if (next === state) return;
      if (state === PLAYING && playingSince !== null) {
        watchedMs += Date.now() - playingSince;
        playingSince = null;
      }
      state = next;

      if (next === PLAYING) {
        playingSince = Date.now();
        if (!watchedVideos.has(videoId)) {
          watchedVideos.add(videoId);
          claritySet("video_watched", [...watchedVideos]);
          clarityEvent("video_play");
          clarityUpgrade("video_play");
          track("video_play");
        }
      } else if (next === ENDED) {
        checkMilestones();
        clarityEvent("video_complete");
        maxPercentOnPage = 100;
        claritySet("video_max_pct", "100");
        track("video_complete", { seconds: Math.round(watchedSec()) });
        reportWatchTime();
      } else if (next === PAUSED) {
        reportWatchTime();
      }
    }

    function onMessage(e: MessageEvent) {
      if (e.source !== iframe!.contentWindow) return;
      let msg: PlayerMessage;
      try {
        msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      connected = true;

      if (msg.event === "onStateChange" && typeof msg.info === "number") {
        setState(msg.info);
      } else if (msg.event === "infoDelivery" && msg.info && typeof msg.info === "object") {
        if (msg.info.duration && msg.info.duration > 0) duration = msg.info.duration;
        if (typeof msg.info.playerState === "number") setState(msg.info.playerState);
        if (state === PLAYING) checkMilestones();
      }
    }

    // O player só responde ao "listening" depois de carregar; insiste até o
    // primeiro retorno (~10s no máximo).
    let attempts = 0;
    const handshake = window.setInterval(() => {
      if (connected || ++attempts > 40) {
        window.clearInterval(handshake);
        return;
      }
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: videoId, channel: "widget" }),
        "*",
      );
    }, 250);

    function onHidden() {
      if (document.visibilityState === "hidden") reportWatchTime();
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("pagehide", reportWatchTime);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.clearInterval(handshake);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", reportWatchTime);
      document.removeEventListener("visibilitychange", onHidden);
      reportWatchTime();
    };
  }, [iframeRef, videoId, active]);
}
