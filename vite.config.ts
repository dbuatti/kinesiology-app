import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Reviewing the demo from the iPad goes through tailscale, and Vite
    // rejects unknown Host headers with a 403 — which looks like the app is
    // down instead of the page being blocked.
    allowedHosts: [".ts.net", "macbook-pro-6.tailab1fd5.ts.net", "localhost", "127.0.0.1"],
  },
  plugins: [react()],
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
    },
  },
}));
