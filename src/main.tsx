import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initFavicon } from "./lib/favicon";

initFavicon();

createRoot(document.getElementById("root")!).render(<App />);
