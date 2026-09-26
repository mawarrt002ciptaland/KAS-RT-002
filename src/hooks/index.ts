import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useUI } from "@/store/ui";
import type { MenuKey } from "@/lib/constants";

/** Subscribe to a CSS media query */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query],
  );
  const getSnapshot = () => window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useIsMobile = () => useMediaQuery("(max-width: 639px)");
export const useIsTablet = () => useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

/** Close on Escape */
export function useEscape(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, active]);
}

let lockCount = 0;
/** Lock body scroll while overlays are open (no layout shift) */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
    return () => {
      lockCount--;
      if (lockCount <= 0) {
        body.style.overflow = prevOverflow;
        body.style.paddingRight = prevPad;
        lockCount = 0;
      }
    };
  }, [active]);
}

/** Simulated fetch lifecycle so views show skeleton/error states like a real API */
export function useLoadState(delay = 220) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay, tick]);
  const refetch = useCallback(() => setTick((x) => x + 1), []);
  return { loading, error, setError, refetch };
}

export function useDebounce<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Quick-action "create" intent consumer */
export function usePendingCreate(view: MenuKey, open: () => void) {
  const pending = useUI((s) => s.pendingCreate);
  const consume = useUI((s) => s.consumePendingCreate);
  useEffect(() => {
    if (pending === view && consume(view)) {
      const t = setTimeout(open, 80);
      return () => clearTimeout(t);
    }
  }, [pending, view, consume, open]);
}

/** Global search hand-off consumer: returns initial query for a view */
export function usePendingSearch(view: MenuKey): string {
  const consume = useUI((s) => s.consumePendingSearch);
  const ref = useRef<string | null>(null);
  if (ref.current === null) ref.current = consume(view) ?? "";
  return ref.current;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installListeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installListeners.forEach((l) => l());
  });
}

/** PWA install prompt */
export function useInstallPrompt() {
  const subscribe = useCallback((cb: () => void) => {
    installListeners.add(cb);
    return () => { installListeners.delete(cb); };
  }, []);
  const canInstall = useSyncExternalStore(subscribe, () => deferredPrompt !== null, () => false);
  const isStandalone = useMediaQuery("(display-mode: standalone)");
  const install = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") deferredPrompt = null;
    installListeners.forEach((l) => l());
    return choice.outcome;
  }, []);
  return useMemo(() => ({ canInstall, isStandalone, install }), [canInstall, isStandalone, install]);
}

/** Current time that ticks every minute (for relative labels) */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
