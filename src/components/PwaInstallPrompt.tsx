import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { usePwaStore } from "@/stores/pwaStore";
import { useAuthStore } from "@/stores/authStore";

export const PwaInstallPrompt = () => {
  const { isAuthenticated } = useAuthStore();
  const { deferredPrompt, dismissed, installed, setDismissed, setInstalled, clearDeferredPrompt } = usePwaStore();
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show only when:
    // 1. User is logged in
    // 2. A deferred prompt exists (browser supports PWA install)
    // 3. User hasn't dismissed or already installed
    // 4. Not already running as standalone (installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isAuthenticated && deferredPrompt && !dismissed && !installed && !isStandalone) {
      // Small delay so it doesn't pop up the instant the feed loads
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, deferredPrompt, dismissed, installed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled();
        if (typeof (window as any).gtag === "function") {
          (window as any).gtag("event", "pwa_install_accepted", { event_category: "PWA" });
        }
      } else {
        setDismissed();
        if (typeof (window as any).gtag === "function") {
          (window as any).gtag("event", "pwa_install_declined", { event_category: "PWA" });
        }
      }
      clearDeferredPrompt();
    } catch {
      // Prompt failed silently
    } finally {
      setIsInstalling(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 md:hidden"
            onClick={handleDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border rounded-t-2xl px-5 py-6 safe-area-pb"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-border">
                  <img src="/favicon.png" alt="Isi Ngala" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">Isi Ngala</p>
                  <p className="text-xs text-muted-foreground">isingala.com</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Add to your home screen</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Install Isi Ngala for faster access, push notifications, and a full-screen app experience — no App Store needed.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {isInstalling ? "Installing..." : "Install App"}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Free • No App Store required • Works offline
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};