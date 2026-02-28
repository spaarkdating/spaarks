import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// This must match the "build" number in public/version.json at build time.
// Increment this value AND the one in public/version.json together when releasing.
const CURRENT_BUILD = 3;

const APK_ORIGIN = "https://spaarks.lovable.app";

const getApkUrl = () => `${APK_ORIGIN}/spaark-debug.apk`;

const getVersionUrl = () => {
  // Always check the live published site for the latest version
  return `${APK_ORIGIN}/version.json`;
};

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showSwUpdate, setShowSwUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [remoteBuild, setRemoteBuild] = useState<number | null>(null);
  const apkUrl = useMemo(() => getApkUrl(), []);

  const isAppMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isCapacitor = Boolean((window as Window & { Capacitor?: unknown }).Capacitor);
    return isStandalone || isCapacitor;
  }, []);

  // Check remote version.json periodically
  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(getVersionUrl(), { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const remote = data.build as number;
      setRemoteBuild(remote);
      if (remote > CURRENT_BUILD) {
        setShowUpdate(true);
      }
    } catch {
      // Network error – silently ignore
    }
  }, []);

  useEffect(() => {
    // Initial check after a short delay
    const initialTimer = window.setTimeout(checkForUpdate, 3000);

    // Re-check every 5 minutes
    const interval = window.setInterval(checkForUpdate, 5 * 60 * 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [checkForUpdate]);

  // Service Worker update detection (for PWA / web users)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let checkInterval: number | undefined;

    const handleSWUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);

        checkInterval = window.setInterval(() => {
          reg.update();
        }, 60 * 1000);

        const onUpdateFound = () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowSwUpdate(true);
            }
          });
        };

        reg.addEventListener("updatefound", onUpdateFound);
        return () => {
          if (checkInterval) window.clearInterval(checkInterval);
          reg.removeEventListener("updatefound", onUpdateFound);
        };
      } catch {
        // ignore
      }
      return () => {
        if (checkInterval) window.clearInterval(checkInterval);
      };
    };

    let cleanup: (() => void) | undefined;
    handleSWUpdate().then((fn) => { cleanup = fn; });

    return () => { cleanup?.(); };
  }, []);

  const handleSwUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const handleApkUpdate = () => {
    window.open(apkUrl, "_blank", "noopener,noreferrer");
    setDismissed(true);
  };

  const hasNewVersion = showUpdate && !dismissed;

  return (
    <>
      {/* Service Worker update banner (web / PWA) */}
      <AnimatePresence>
        {showSwUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-0 left-0 right-0 z-[100] safe-area-pt"
          >
            <div className="mx-3 mt-2 liquid-glass-strong !rounded-2xl p-3 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Update Available</p>
                <p className="text-xs text-muted-foreground">Tap to install the latest version</p>
              </div>
              <Button
                size="sm"
                onClick={handleSwUpdate}
                className="rounded-full px-4 text-xs font-bold shadow-md shadow-primary/20"
              >
                Update
              </Button>
              <button onClick={() => setShowSwUpdate(false)} className="p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APK update button – only for installed app mode AND only when remote build > current */}
      <AnimatePresence>
        {isAppMode && hasNewVersion && (
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35 }}
            onClick={handleApkUpdate}
            className="fixed right-4 z-[95] h-11 px-4 rounded-full liquid-glass-strong border border-primary/30 text-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)] flex items-center gap-2 font-semibold text-xs"
            style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          >
            <ArrowUpCircle className="h-4 w-4 text-primary" />
            Update App
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
