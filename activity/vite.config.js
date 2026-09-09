import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,

    allowedHosts: [
      "skip-well-ferry-closest.trycloudflare.com"
    ],

    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },

      "/avatar": {
        target: "https://tiktok-shop-screener-api.austindtaylor7.workers.dev",
        changeOrigin: true
      }
    }
  }
});
