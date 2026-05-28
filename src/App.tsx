import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AppState, TweakSettings, DayKey, DayMeta } from './store/types';
import { DAYS, DAY_KEYS, MONTHS_FR, DEFAULT_SETTINGS } from './store/types';
import { loadState, saveState, loadSettings, saveSettings, clearAll } from './store/persistence';
import { makeSeedState } from './store/seed';
import { WeekView } from './views/WeekView';
import { TodayView } from './views/TodayView';
import { AddTaskModal } from './components/AddTaskModal';
import { TweaksPanel } from './components/TweaksPanel';
import type { Task } from './store/types';

// ── date helpers ────────────────────────────────────────────────────────────

function computeWeek(): DayMeta[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return DAYS.map((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      ...d,
      date,
      label: `${String(date.getDate()).padStart(2, '0')} ${MONTHS_FR[date.getMonth()]}`,
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

function getTodayKey(): DayKey {
  return DAY_KEYS[(new Date().getDay() + 6) % 7];
}

// ── notification helper ─────────────────────────────────────────────────────

async function fireNotification(body: string) {
  if (!('__TAURI_INTERNALS__' in window)) return;
  try {
    const { isPermissionGranted, requestPermission, sendNotification } =
      await import('@tauri-apps/plugin-notification');
    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === 'granted';
    }
    if (granted) sendNotification({ title: 'TO·DO·TAPE ♪', body });
  } catch (e) {
    console.error('Notification failed', e);
  }
}

// ── App ─────────────────────────────────────────────────────────────────────

export function App() {
  const [loading, setLoading] = useState(true);
  const [state, setState]     = useState<AppState>({ tasks: [], done: [] });
  const [settings, setSettings] = useState<TweakSettings>(DEFAULT_SETTINGS);
  const [view, setView]         = useState<'week' | 'today'>('week');
  const [modal, setModal]       = useState<{ prefillDay?: DayKey } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const weekDates = useMemo(() => computeWeek(), []);
  const [todayKey, setTodayKey] = useState<DayKey>(getTodayKey);

  // Recalculate todayKey at midnight
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };
    const t = setTimeout(() => setTodayKey(getTodayKey()), msUntilMidnight());
    return () => clearTimeout(t);
  }, [todayKey]);

  // Load persisted data
  useEffect(() => {
    Promise.all([loadState(), loadSettings()]).then(([s, cfg]) => {
      setState(s);
      setSettings(cfg);
      setView(cfg.default_view);
      setLoading(false);
    });
  }, []);

  // Persist state whenever it changes (debounced)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, loading]);

  // Persist settings whenever they change
  useEffect(() => {
    if (!loading) saveSettings(settings);
  }, [settings, loading]);

  // Daily notification scheduler
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    if (!settings.daily_notification) return;

    const schedule = () => {
      const now = new Date();
      const [h, m] = settings.notification_time.split(':').map(Number);
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const delay = next.getTime() - now.getTime();
      notifTimerRef.current = setTimeout(() => {
        const key = getTodayKey();
        const count = state.tasks.filter(t => t.day === key).length;
        const body = count === 0
          ? "Aucune tâche prévue aujourd'hui — journée libre ♥"
          : `${count} tâche${count > 1 ? 's' : ''} au programme aujourd'hui`;
        fireNotification(body);
        schedule(); // reschedule for the next day
      }, delay);
    };
    schedule();
    return () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); };
  }, [settings.daily_notification, settings.notification_time, state.tasks]);

  // Listen for tray-menu "new task" event
  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    let unlisten: (() => void) | null = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<void>('menu:new-task', () => {
        setModal({ prefillDay: view === 'today' ? todayKey : undefined });
      }).then(fn => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, [view, todayKey]);

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (modal) return; // modal handles its own Escape
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setModal({ prefillDay: view === 'today' ? todayKey : undefined });
      }
      if (e.ctrlKey && e.key === '1') { e.preventDefault(); setView('week'); }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); setView('today'); }
      if (e.key === 'Escape' && prefsOpen) setPrefsOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal, view, todayKey, prefsOpen]);

  // ── task mutations ─────────────────────────────────────────────────────────

  const toggle = useCallback((task: Task) => {
    setState(s => {
      if (task.done) {
        const found = s.done.find(t => t.id === task.id);
        if (!found) return s;
        return {
          tasks: [...s.tasks, { ...found, done: false }],
          done:  s.done.filter(t => t.id !== task.id),
        };
      } else {
        const found = s.tasks.find(t => t.id === task.id);
        if (!found) return s;
        return {
          tasks: s.tasks.filter(t => t.id !== task.id),
          done:  [{ ...found, done: true }, ...s.done],
        };
      }
    });
  }, []);

  const del = useCallback((task: Task) => {
    setState(s => task.done
      ? { ...s, done:  s.done.filter(x  => x.id !== task.id) }
      : { ...s, tasks: s.tasks.filter(x => x.id !== task.id) });
  }, []);

  const openAdd = useCallback((day?: DayKey) => {
    setModal({ prefillDay: day });
  }, []);

  const moveTask = useCallback((task: Task, newDay: DayKey) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === task.id ? { ...t, day: newDay } : t),
    }));
  }, []);

  const saveNew = useCallback((data: { name: string; day: DayKey; end: DayKey | null; prio: 1 | 2 | 3 }) => {
    setState(s => ({
      ...s,
      tasks: [...s.tasks, { ...data, id: Math.random().toString(36).slice(2, 9), done: false }],
    }));
    setModal(null);
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm("Réinitialiser toutes les tâches (revenir au jeu d'exemple) ?")) return;
    clearAll().then(() => setState(makeSeedState()));
  }, []);

  const handleTweakChange = useCallback(
    (key: keyof TweakSettings, value: TweakSettings[keyof TweakSettings]) => {
      setSettings(s => ({ ...s, [key]: value }));
    },
    [],
  );

  // ── derived counters ───────────────────────────────────────────────────────

  const totals = {
    today: state.tasks.filter(x => x.day === todayKey).length,
    todo:  state.tasks.length,
    done:  state.done.length,
  };

  const accent = settings.accent;

  if (loading) {
    return <div className="loading-screen">CHARGEMENT…</div>;
  }

  return (
    <div
      className="page"
      style={{ '--accent': accent, '--accent-soft': accent + '33' } as React.CSSProperties}
      data-paper-grid={settings.paper_grid ? '1' : '0'}
      data-density={settings.density}
    >
      {/* ── header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-tape">▶</span>
          <h1>TO·DO·TAPE</h1>
          <span className="brand-sub">retro groove edition</span>
        </div>
        <div className="app-counters">
          <span><b>{totals.today}</b> aujourd'hui</span>
          <span><b>{totals.todo}</b> cette semaine</span>
          <span><b>{totals.done}</b> ✓ face B</span>
        </div>
      </header>

      {/* ── toolbar ────────────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="view-tabs big">
          <button
            className={`view-tab ${view === 'week' ? 'is-active' : ''}`}
            onClick={() => setView('week')}
            title="Ctrl+1"
          >
            SEMAINE
          </button>
          <button
            className={`view-tab ${view === 'today' ? 'is-active' : ''}`}
            onClick={() => setView('today')}
            title="Ctrl+2"
          >
            AUJOURD'HUI
          </button>
        </div>
        <div className="toolbar-actions">
          <button
            className="btn-icon"
            onClick={() => setPrefsOpen(p => !p)}
            title="Préférences"
            aria-label="Ouvrir les préférences"
          >
            ⚙
          </button>
          <button
            className="btn-sketch primary"
            onClick={() => openAdd(view === 'today' ? todayKey : undefined)}
            title="Ctrl+N"
          >
            + Nouvelle tâche
          </button>
        </div>
      </div>

      {/* ── main canvas ────────────────────────────────────────────────── */}
      <main className="canvas">
        {view === 'week' ? (
          <WeekView
            state={state}
            weekDates={weekDates}
            onToggle={toggle}
            onDelete={del}
            onAdd={openAdd}
            onMove={moveTask}
          />
        ) : (
          <TodayView
            state={state}
            weekDates={weekDates}
            todayKey={todayKey}
            onToggle={toggle}
            onDelete={del}
            onAdd={openAdd}
          />
        )}
      </main>

      <p className="foot-note">
        ♪ vos tâches sont sauvegardées en local · côté A = à faire, côté B = fait ♪
      </p>

      {/* ── modal ──────────────────────────────────────────────────────── */}
      {modal && (
        <AddTaskModal
          defaults={{ day: modal.prefillDay }}
          weekDates={weekDates}
          todayKey={todayKey}
          onSave={saveNew}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── prefs panel ────────────────────────────────────────────────── */}
      {prefsOpen && (
        <TweaksPanel
          settings={settings}
          onChange={handleTweakChange}
          onReset={handleReset}
          onClose={() => setPrefsOpen(false)}
        />
      )}
    </div>
  );
}
