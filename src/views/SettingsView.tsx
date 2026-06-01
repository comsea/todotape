import { useRef, useCallback } from 'react';
import type { TweakSettings } from '../store/types';
import type { XPState } from '../store/xp';
import { getGrade, getNextGrade, GRADES } from '../store/xp';
import { APP_VERSION } from '../version';
import { clearAll } from '../store/persistence';
import { saveArchives } from '../store/persistence';

interface Props {
  settings: TweakSettings;
  xp: XPState;
  onChange: (key: keyof TweakSettings, value: TweakSettings[keyof TweakSettings]) => void;
  onResetTasks: () => void;
  onResetXP: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

const ACCENT_OPTIONS = [
  { value: '#ff2d8a', label: 'Rose 80s' },
  { value: '#ff7a3c', label: 'Orange' },
  { value: '#00c2cf', label: 'Cyan' },
  { value: '#a85bff', label: 'Violet' },
  { value: '#f0c030', label: 'Jaune' },
  { value: '#30d080', label: 'Vert' },
];

const THEMES = [
  { value: 'paper', label: 'Papier' },
  { value: 'dark',  label: 'Sombre' },
];

function Section({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="set-section">
      <span className="set-section-icon">{icon}</span>
      <span className="set-section-title">{title}</span>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div className="set-row-left">
        <span className="set-row-label">{label}</span>
        {desc && <span className="set-row-desc">{desc}</span>}
      </div>
      <div className="set-row-right">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`set-toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="set-toggle-thumb" />
    </button>
  );
}

export function SettingsView({ settings, xp, onChange, onResetTasks, onResetXP, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const grade   = getGrade(xp.total);
  const next    = getNextGrade(xp.total);

  const handleAutostart = async (v: boolean) => {
    onChange('start_with_windows', v);
    try {
      if ('__TAURI_INTERNALS__' in window) {
        const { enable, disable } = await import('@tauri-apps/plugin-autostart');
        if (v) await enable(); else await disable();
      }
    } catch (e) { console.error('Autostart failed', e); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') onImport(reader.result); };
    reader.readAsText(file);
  };

  const handleClearArchives = async () => {
    if (!confirm('Supprimer toutes les archives ? Cette action est irréversible.')) return;
    await saveArchives([]);
    alert('Archives supprimées.');
  };

  return (
    <div className="set-wrap">

      {/* ── Apparence ── */}
      <Section icon="🎨" title="Apparence" />

      <div className="set-card">
        <Row label="Couleur d'accent">
          <div className="set-chips">
            {ACCENT_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                className={`set-chip ${settings.accent === o.value ? 'on' : ''}`}
                style={{ background: o.value }}
                onClick={() => onChange('accent', o.value)}
                title={o.label}
              >
                {settings.accent === o.value && <span>✓</span>}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Fond pointillé" desc="Texture papier en arrière-plan">
          <Toggle value={settings.paper_grid} onChange={v => onChange('paper_grid', v)} />
        </Row>

        <Row label="Densité des tâches">
          <div className="set-seg">
            {(['compact', 'regular', 'aéré'] as const).map(d => (
              <button key={d} type="button"
                className={`set-seg-btn ${settings.density === d ? 'on' : ''}`}
                onClick={() => onChange('density', d)}
              >{d}</button>
            ))}
          </div>
        </Row>

        <Row label="Vue par défaut">
          <div className="set-seg">
            {(['today', 'week', 'next'] as const).map(v => (
              <button key={v} type="button"
                className={`set-seg-btn ${settings.default_view === v ? 'on' : ''}`}
                onClick={() => onChange('default_view', v)}
              >{v === 'today' ? "auj." : v === 'week' ? 'S' : 'S+1'}</button>
            ))}
          </div>
        </Row>
      </div>

      {/* ── Notifications ── */}
      <Section icon="🔔" title="Notifications" />

      <div className="set-card">
        <Row label="Rappel quotidien" desc="Notification chaque matin">
          <Toggle value={settings.daily_notification} onChange={v => onChange('daily_notification', v)} />
        </Row>

        {settings.daily_notification && (
          <Row label="Heure du rappel">
            <input
              type="time"
              className="set-time"
              value={settings.notification_time}
              onChange={e => onChange('notification_time', e.target.value)}
            />
          </Row>
        )}

        {'__TAURI_INTERNALS__' in window && (
          <Row label="Démarrer avec Windows" desc="Lancer l'app au démarrage du PC">
            <Toggle value={settings.start_with_windows} onChange={handleAutostart} />
          </Row>
        )}
      </div>

      {/* ── Progression ── */}
      <Section icon="🎮" title="Progression" />

      <div className="set-card">
        <div className="set-grade-banner">
          <span className="set-grade-icon">{grade.icon}</span>
          <div className="set-grade-info">
            <div className="set-grade-name">{grade.name}</div>
            <div className="set-grade-xp">{xp.total.toLocaleString('fr-FR')} XP{next ? ` · encore ${(next.minXP - xp.total).toLocaleString('fr-FR')} pour ${next.name}` : ' · Grade max !'}</div>
          </div>
        </div>
        <div className="set-xp-bar">
          <div className="set-xp-fill" style={{
            width: next
              ? `${Math.round(((xp.total - grade.minXP) / (next.minXP - grade.minXP)) * 100)}%`
              : '100%'
          }} />
        </div>
        <div className="set-row" style={{ paddingTop: 12 }}>
          <button type="button" className="set-btn danger" onClick={() => {
            if (confirm('Réinitialiser tout l\'XP et revenir au grade Stagiaire ?')) onResetXP();
          }}>
            ↺ Réinitialiser l'XP
          </button>
        </div>
      </div>

      {/* ── Données ── */}
      <Section icon="📦" title="Données" />

      <div className="set-card">
        <Row label="Exporter les tâches" desc="Sauvegarder en fichier JSON">
          <button type="button" className="set-btn" onClick={onExport}>⬇ Exporter</button>
        </Row>

        <Row label="Importer des tâches" desc="Restaurer depuis un fichier JSON">
          <button type="button" className="set-btn" onClick={() => fileRef.current?.click()}>⬆ Importer</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </Row>

        <Row label="Vider les archives" desc="Supprimer l'historique des semaines">
          <button type="button" className="set-btn danger" onClick={handleClearArchives}>🗑 Vider</button>
        </Row>

        <Row label="Réinitialiser les tâches" desc="Efface toutes les tâches en cours">
          <button type="button" className="set-btn danger" onClick={onResetTasks}>↺ Réinitialiser</button>
        </Row>
      </div>

      {/* ── À propos ── */}
      <Section icon="ℹ️" title="À propos" />

      <div className="set-card set-about">
        <div className="set-about-logo">TODOTAPE</div>
        <div className="set-about-version">version {APP_VERSION}</div>
        <div className="set-about-made">Fait avec ♥ par <b>NervyFox</b></div>
        <div className="set-about-desc">
          Une todo list rétro-groove pensée pour les cerveaux TDAH.
          Coche, progresse, deviens légende.
        </div>
      </div>

    </div>
  );
}
