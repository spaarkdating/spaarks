import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FALLBACK_APK_URL = "https://spaarks.lovable.app/spaark-debug.apk";

const getApkUrl = () => {
  if (typeof window === "undefined") return FALLBACK_APK_URL;

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return FALLBACK_APK_URL;
  }

  return `${window.location.origin}/spaark-debug.apk`;
};

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showManualUpdate, setShowManualUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const apkUrl = useMemo(() => getApkUrl(), []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    const isCapacitor = Boolean((window as Window & { Capacitor?: unknown }).Capacitor);
    setShowManualUpdate(isStandalone || isCapacitor);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let checkInterval: number | undefined;

    const onControllerChange = () => {
      // New SW has taken control.
    };

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

          const onStateChange = () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          };

          newWorker.addEventListener("statechange", onStateChange);
        };

        reg.addEventListener("updatefound", onUpdateFound);
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        return () => {
          if (checkInterval) {
            window.clearInterval(checkInterval);
          }
          reg.removeEventListener("updatefound", onUpdateFound);
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
      } catch (error) {
        console.log("SW registration error:", error);
      }

      return () => {
        if (checkInterval) {
          window.clearInterval(checkInterval);
        }
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      };
    };

    let cleanup: (() => void) | undefined;

    handleSWUpdate().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
      if (checkInterval) {
        window.clearInterval(checkInterval);
      }
    };
  }, []);

  const handlePromptUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const handleManualUpdate = () => {
    window.open(apkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <AnimatePresence>
        {showUpdate && (
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
                onClick={handlePromptUpdate}
                className="rounded-full px-4 text-xs font-bold shadow-md shadow-primary/20"
              >
                Update
              </Button>
              <button onClick={() => setShowUpdate(false)} className="p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showManualUpdate && (
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          onClick={handleManualUpdate}
          className="fixed right-4 z-[95] h-11 px-4 rounded-full liquid-glass-strong border border-primary/30 text-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)] flex items-center gap-2 font-semibold text-xs"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          <ArrowUpCircle className="h-4 w-4 text-primary" />
          Update App
        </motion.button>
      )}
    </>
  );
}
