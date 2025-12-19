import { Download, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion } from "framer-motion";

export function InstallAppBanner() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  // Check if on iOS (iOS doesn't support beforeinstallprompt)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isInstalled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center"
      >
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <p className="text-foreground font-medium">App installed!</p>
        <p className="text-muted-foreground text-sm">Open Spaark from your home screen</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-6 text-center"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Smartphone className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Get the Spaark App</h3>
      <p className="text-muted-foreground text-sm mb-4">
        Install our app for a faster, smoother experience with instant notifications
      </p>

      {isInstallable ? (
        <Button
          onClick={installApp}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-full px-6"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      ) : isIOS ? (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-medium">To install on iOS:</p>
          <ol className="text-left space-y-1 pl-4">
            <li>1. Tap the <strong>Share</strong> button (square with arrow)</li>
            <li>2. Scroll and tap <strong>Add to Home Screen</strong></li>
            <li>3. Tap <strong>Add</strong> to confirm</li>
          </ol>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">To install on Android/Desktop:</p>
          <ol className="text-left space-y-1 pl-4">
            <li>1. Tap the <strong>menu (⋮)</strong> in Chrome</li>
            <li>2. Select <strong>Install app</strong> or <strong>Add to Home Screen</strong></li>
          </ol>
        </div>
      )}
    </motion.div>
  );
}
