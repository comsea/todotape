import { useRegisterSW } from 'virtual:pwa-register/react';

export function useServiceWorker() {
  // autoUpdate: le SW se met à jour tout seul, needRefresh sera toujours false
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  return { needRefresh, updateServiceWorker };
}
