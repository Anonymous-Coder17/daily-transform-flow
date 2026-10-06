import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIPEvent; notify(); });
  window.addEventListener("appinstalled", () => { deferred = null; notify(); });
}

export type Platform = "ios" | "mac-safari" | "android" | "chromium" | "firefox" | "other";

function detect(): Platform {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/.test(ua)) return "android";
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  if (safari && /Macintosh/.test(ua)) return "mac-safari";
  if (/Firefox/.test(ua)) return "firefox";
  if (/Chrome|Chromium|Edg/.test(ua)) return "chromium";
  return "other";
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function useInstall() {
  const [state, setState] = useState<{ ready: boolean; installed: boolean; canPrompt: boolean; platform: Platform }>({ ready: false, installed: false, canPrompt: false, platform: "other" });
  useEffect(() => {
    const update = () => setState({ ready: true, installed: isStandalone(), canPrompt: !!deferred, platform: detect() });
    update();
    listeners.add(update);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", update);
    return () => { listeners.delete(update); mq.removeEventListener("change", update); };
  }, []);
  async function prompt() {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null; notify();
    return outcome === "accepted";
  }
  return { ...state, prompt };
}
