import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Keep HMR enabled so the websocket stays alive while the tab is
    // backgrounded — with hmr disabled, Vite falls back to full document
    // reloads whenever the connection drops/reconnects (which is what made
    // the page reload on Cmd+Tab). React Refresh is still off via the SWC
    // plugin option below.
    hmr: true,

    // Reviewing the demo from the iPad goes through tailscale, and Vite
    // rejects unknown Host headers with a 403 — which looks like the app is
    // down instead of the page being blocked.
    allowedHosts: [".ts.net", "macbook-pro-6.tailab1fd5.ts.net", "localhost", "127.0.0.1"],
  },
  plugins: [
    react({ reactRefresh: false }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("react-router-dom")) return "vendor-router";
          if (id.includes("react-dom")) return "vendor-react-dom";
          if (id.includes("react")) return "vendor-react";
          return "vendor";
        },
      },
      input: {
        main: "index.html",
        guide: "guide.html",
      },
    },
  },
}));
