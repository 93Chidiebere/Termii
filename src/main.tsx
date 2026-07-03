import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initFavicon } from "./lib/favicon";

initFavicon();

createRoot(document.getElementById("root")!).render(<App />);

// Track PWA install prompt
let deferredPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // User was shown the install prompt
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "pwa_prompt_shown", { event_category: "PWA" });
  }
});

window.addEventListener("appinstalled", () => {
  // User accepted and installed
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "pwa_installed", { event_category: "PWA" });
  }
  deferredPrompt = null;
});

// Register service worker for PWA installability
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {});
  });
}

// // Register service worker for PWA installability
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .catch(() => {
//         // SW registration failed — app still works, just not installable
//       });
//   });
// }