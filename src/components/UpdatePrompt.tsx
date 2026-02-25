import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleSWUpdate = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);

        // Check for updates periodically
        const checkInterval = setInterval(() => {
          reg.update();
        }, 60 * 1000); // every minute

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });

        // Also listen for controllerchange
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // New SW has taken control, but don't auto-reload
        });

        return () => clearInterval(checkInterval);
      } catch (err) {
        console.log("SW registration error:", err);
      }
    };

    handleSWUpdate();
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  return (
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
              <p className="text-xs text-muted-foreground">Tap to get the latest version</p>
            </div>
            <Button
              size="sm"
              onClick={handleUpdate}
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
  );
}
