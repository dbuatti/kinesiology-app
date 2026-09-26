import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// After globals.css on purpose: dark-mode remaps must come after the utilities they override.
import "./styles/dark-palette.css";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// One passive listener powers every .spotlight surface in the app.
if (typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches) {
  window.addEventListener(
    "pointermove",
    (e) => {
      const el = (e.target as Element | null)?.closest?.(".spotlight") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true }
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);