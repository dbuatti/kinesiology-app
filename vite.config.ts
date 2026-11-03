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
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js", "@supabase/auth-ui-react", "@supabase/auth-ui-shared"],
        },
      },
      input: {
        main: "index.html",
        guide: "guide.html",
      },
    },
  },
}));
