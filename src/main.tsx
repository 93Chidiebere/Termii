// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// import { initFavicon } from "./lib/favicon";

// initFavicon();

// createRoot(document.getElementById("root")!).render(<App />);

// // Track PWA install prompt
// let deferredPrompt: any = null;
// window.addEventListener("beforeinstallprompt", (e) => {
//   e.preventDefault();
//   deferredPrompt = e;
//   // User was shown the install prompt
//   if (typeof (window as any).gtag === "function") {
//     (window as any).gtag("event", "pwa_prompt_shown", { event_category: "PWA" });
//   }
// });

// window.addEventListener("appinstalled", () => {
//   // User accepted and installed
//   if (typeof (window as any).gtag === "function") {
//     (window as any).gtag("event", "pwa_installed", { event_category: "PWA" });
//   }
//   deferredPrompt = null;
// });

// // Register service worker for PWA installability
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .catch(() => {});
//   });
// }

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initFavicon } from "./lib/favicon";

initFavicon();

createRoot(document.getElementById("root")!).render(<App />);

// Capture and store the install prompt for later use
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // Stop the default mini-infobar
  // Store the prompt in our PWA store
  import("@/stores/pwaStore").then(({ usePwaStore }) => {
    usePwaStore.getState().setDeferredPrompt(e);
  });
  // Track in GA
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "pwa_prompt_available", { event_category: "PWA" });
  }
});

// Track successful installs
window.addEventListener("appinstalled", () => {
  import("@/stores/pwaStore").then(({ usePwaStore }) => {
    usePwaStore.getState().setInstalled();
  });
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "pwa_installed", { event_category: "PWA" });
  }
});

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}