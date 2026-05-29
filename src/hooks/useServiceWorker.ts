import { useRegisterSW } from "virtual:pwa-register/react";

export function useServiceWorker() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Vérifie une mise à jour toutes les 60 secondes
      if (r) setInterval(() => r.update(), 60 * 1000);
    },
  });

  return { needRefresh, updateServiceWorker };
}
