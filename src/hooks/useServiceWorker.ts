import { useState } from 'react';

// Stub utilisé pour le build Tauri (le vrai hook PWA est injecté par vite-plugin-pwa
// uniquement dans le build web, via l'alias défini dans vite.config.ts)
export function useServiceWorker() {
  const [needRefresh] = useState(false);
  const updateServiceWorker = async (_?: boolean) => {};
  return { needRefresh, updateServiceWorker };
}
