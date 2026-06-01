import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]   = useState(false);
  const [isIOS, setIsIOS]               = useState(false);

  useEffect(() => {
    // Déjà installée ?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone = ('standalone' in navigator) && (navigator as { standalone?: boolean }).standalone;
    setIsIOS(ios && !standalone);

    // Android / Chrome : écouter l'event beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Installée après coup
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallEvent(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallEvent(null);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TODOTAPE',
          text: '📼 Essaie TODOTAPE — une todo list rétro-groove !',
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Lien copié dans le presse-papier !');
    }
  };

  return {
    canInstall: !!installEvent,
    isInstalled,
    isIOS,
    triggerInstall,
    share,
  };
}
