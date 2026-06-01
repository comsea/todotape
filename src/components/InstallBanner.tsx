import { useState } from 'react';

interface Props {
  canInstall: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallBanner({ canInstall, isIOS, onInstall, onDismiss }: Props) {
  if (!canInstall && !isIOS) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-left">
        <span className="install-banner-icon">📼</span>
        <div className="install-banner-text">
          <span className="install-banner-title">Installe TODOTAPE !</span>
          {isIOS ? (
            <span className="install-banner-sub">
              Tape <b>⬆</b> puis <b>"Sur l'écran d'accueil"</b>
            </span>
          ) : (
            <span className="install-banner-sub">
              Ajoute l'app sur ton écran d'accueil
            </span>
          )}
        </div>
      </div>
      <div className="install-banner-actions">
        {!isIOS && (
          <button className="install-btn" onClick={onInstall}>
            ▶ INSTALLER
          </button>
        )}
        <button className="install-dismiss" onClick={onDismiss} aria-label="Fermer">✕</button>
      </div>
    </div>
  );
}
