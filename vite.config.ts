import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isTauri = process.env.TAURI_ENV_TARGET_TRIPLE !== undefined;

export default defineConfig({
  plugins: [
    react(),
    // Le plugin PWA est désactivé pour les builds Tauri (.msi)
    !isTauri && VitePWA({
      registerType: "prompt",           // On demande confirmation avant de recharger
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Network first pour les requêtes de navigation → toujours la dernière version
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
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
  base: isTauri ? "/" : "/todotape/",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
