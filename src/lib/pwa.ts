// Single place that registers the app service worker. Refuses in dev/preview/iframes.
const SW_URL = "/sw.js";

function refused() {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterOurs() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL))).map((r) => r.unregister()));
}

export function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) { void unregisterOurs(); return; }
  window.addEventListener("load", () => { void navigator.serviceWorker.register(SW_URL, { scope: "/" }); });
}
