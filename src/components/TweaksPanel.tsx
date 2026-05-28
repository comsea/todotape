import { useRef, useCallback, useEffect } from 'react';
import type { TweakSettings } from '../store/types';

interface TweaksPanelProps {
  settings: TweakSettings;
  onChange: (key: keyof TweakSettings, value: TweakSettings[keyof TweakSettings]) => void;
  onReset: () => void;
  onClose: () => void;
}

const ACCENT_OPTIONS = [
  { value: '#ff2d8a', label: 'Rose 80s' },
  { value: '#ff7a3c', label: 'Orange' },
  { value: '#00c2cf', label: 'Cyan' },
  { value: '#a85bff', label: 'Violet' },
];

function TweakSection({ label }: { label: string }) {
  return <div className="twk-sect">{label}</div>;
}

function TweakToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button
        type="button"
        className="twk-toggle"
        data-on={value ? '1' : '0'}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

function TweakRadio<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, options.indexOf(value));
  const n = options.length;

  const segAt = (clientX: number): T => {
    if (!trackRef.current) return value;
    const r = trackRef.current.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left - 2) / (r.width - 4)) * n);
    return options[Math.max(0, Math.min(n - 1, i))];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const v0 = segAt(e.clientX);
    if (v0 !== value) onChange(v0);
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== value) onChange(v);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown} className="twk-seg">
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`,
          }}
        />
        {options.map(o => (
          <button key={o} type="button" role="radio" aria-checked={o === value}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweakColorChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div className="twk-chips" role="radiogroup">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className="twk-chip"
            role="radio"
            aria-checked={o.value === value}
            data-on={o.value === value ? '1' : '0'}
            aria-label={o.label}
            title={o.label}
            style={{ background: o.value }}
            onClick={() => onChange(o.value)}
          >
            {o.value === value && (
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M3 7.2 5.8 10 11 4.2"
                  fill="none"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="#fff"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweakTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input
        type="time"
        className="twk-field"
        style={{ width: 90 }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function TweaksPanel({ settings, onChange, onReset, onClose }: TweaksPanelProps) {
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clamp = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    offsetRef.current = {
      x: Math.min(Math.max(PAD, offsetRef.current.x), Math.max(PAD, window.innerWidth - w - PAD)),
      y: Math.min(Math.max(PAD, offsetRef.current.y), Math.max(PAD, window.innerHeight - h - PAD)),
    };
    panel.style.right  = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [clamp]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight  = window.innerWidth  - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight  - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clamp();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleAutostart = async (v: boolean) => {
    onChange('start_with_windows', v);
    try {
      if ('__TAURI_INTERNALS__' in window) {
        const { enable, disable } = await import('@tauri-apps/plugin-autostart');
        if (v) await enable(); else await disable();
      }
    } catch (e) {
      console.error('Autostart toggle failed', e);
    }
  };

  return (
    <div
      ref={dragRef}
      className="twk-panel"
      style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}
    >
      <div className="twk-hd" onMouseDown={onDragStart}>
        <b>⚙ Préférences</b>
        <button
          className="twk-x"
          aria-label="Fermer les préférences"
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="twk-body">
        <TweakSection label="Apparence" />

        <TweakColorChips
          label="Couleur d'accent"
          value={settings.accent}
          options={ACCENT_OPTIONS}
          onChange={v => onChange('accent', v)}
        />

        <TweakToggle
          label="Fond papier pointillé"
          value={settings.paper_grid}
          onChange={v => onChange('paper_grid', v)}
        />

        <TweakRadio
          label="Densité"
          value={settings.density}
          options={['compact', 'regular', 'aéré'] as const}
          onChange={v => onChange('density', v)}
        />

        <TweakSection label="Démarrage" />

        <TweakRadio
          label="Vue par défaut"
          value={settings.default_view}
          options={['week', 'today'] as const}
          onChange={v => onChange('default_view', v)}
        />

        <TweakSection label="Notifications" />

        <TweakToggle
          label="Rappel quotidien 9h"
          value={settings.daily_notification}
          onChange={v => onChange('daily_notification', v)}
        />

        {settings.daily_notification && (
          <TweakTimeInput
            label="Heure"
            value={settings.notification_time}
            onChange={v => onChange('notification_time', v)}
          />
        )}

        <TweakSection label="Système" />

        <TweakToggle
          label="Démarrer avec Windows"
          value={settings.start_with_windows}
          onChange={handleAutostart}
        />

        <TweakSection label="Données" />

        <button
          type="button"
          className="twk-btn secondary"
          onClick={onReset}
        >
          ↺ Réinitialiser les tâches
        </button>
      </div>
    </div>
  );
}
