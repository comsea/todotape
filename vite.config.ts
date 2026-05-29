import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isTauri = process.env.TAURI_ENV_TARGET_TRIPLE !== undefined;

export default defineConfig({
  plugins: [react()],
  base: isTauri ? "/" : "/todotape/",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
