import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const isTauri = process.env.TAURI_ENV_TARGET_TRIPLE !== undefined;

export default defineConfig({
  plugins: [
    react(),
    !isTauri && VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
      },
      manifest: {
        name: "TO·DO·TAPE",
        short_name: "TodoTape",
        description: "Retro groove todo list",
        theme_color: "#ece2c9",
        background_color: "#ece2c9",
        display: "standalone",
        orientation: "portrait",
        start_url: "/todotape/",
        scope: "/todotape/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Pour le build PWA → vrai hook avec virtual:pwa-register
      // Pour le build Tauri → stub sans dépendance PWA
      '@/hooks/useServiceWorker': isTauri
        ? path.resolve(__dirname, 'src/hooks/useServiceWorker.ts')
        : path.resolve(__dirname, 'src/hooks/useServiceWorkerPWA.ts'),
    },
  },
  base: isTauri ? "/" : "/todotape/",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
