import { useRegisterSW } from 'virtual:pwa-register/react';

export function useServiceWorker() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) setInterval(() => r.update(), 60 * 1000);
    },
  });
  return { needRefresh, updateServiceWorker };
}
