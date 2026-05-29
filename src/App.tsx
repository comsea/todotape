import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AppState, TweakSettings, DayKey, DayMeta, WeekKey } from './store/types';
import { DAYS, DAY_KEYS, MONTHS_FR, DEFAULT_SETTINGS } from './store/types';
import { loadState, saveState, loadSettings, saveSettings, clearAll } from './store/persistence';
import { makeSeedState } from './store/seed';
import { WeekView }      from './views/WeekView';
import { TodayView }     from './views/TodayView';
import { DashboardView } from './views/DashboardView';
import { ArchivesView }  from './views/ArchivesView';
import { ScoreView }     from './views/ScoreView';
import { AddTaskModal }  from './components/AddTaskModal';
import { TweaksPanel }   from './components/TweaksPanel';
import type { Task } from './store/types';

type PageId = 'tapes' | 'dashboard' | 'archives' | 'score';
type TapeView = 'today' | 'week' | 'next';

function computeWeek(offsetWeeks: number): DayMeta[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + offsetWeeks * 7);
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

async function fireNotification(body: string) {
  if (!('__TAURI_INTERNALS__' in window)) return;
  try {
    const { isPermissionGranted, requestPermission, sendNotification } =
      await import('@tauri-apps/plugin-notification');
    let granted = await isPermissionGranted();
    if (!granted) { const p = await requestPermission(); granted = p === 'granted'; }
    if (granted) sendNotification({ title: 'TO·DO·TAPE ♪', body });
  } catch (e) { console.error('Notification failed', e); }
}

const NAV: Array<{ id: PageId; icon: string; label: string }> = [
  { id: 'tapes',     icon: '📼', label: 'Mes tapes' },
  { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
  { id: 'archives',  icon: '🗃', label: 'Archives' },
  { id: 'score',     icon: '🏆', label: 'Score' },
];

export function App() {
  const [loading, setLoading]     = useState(true);
  const [state, setState]         = useState<AppState>({ tasks: [], done: [] });
  const [settings, setSettings]   = useState<TweakSettings>(DEFAULT_SETTINGS);
  const [page, setPage]           = useState<PageId>('tapes');
  const [tapeView, setTapeView]   = useState<TapeView>('week');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [modal, setModal]         = useState<{ prefillDay?: DayKey; prefillWeek?: WeekKey } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const currentWeekDates = useMemo(() => computeWeek(0), []);
  const nextWeekDates    = useMemo(() => computeWeek(1), []);
  const [todayKey, setTodayKey] = useState<DayKey>(getTodayKey);

  useEffect(() => {
    const ms = () => { const n = new Date(), m = new Date(n); m.setHours(24,0,0,0); return m.getTime()-n.getTime(); };
    const t = setTimeout(() => setTodayKey(getTodayKey()), ms());
    return () => clearTimeout(t);
  }, [todayKey]);

  useEffect(() => {
    Promise.all([loadState(), loadSettings()]).then(([s, cfg]) => {
      setState(s); setSettings(cfg); setLoading(false);
    });
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, loading]);

  useEffect(() => { if (!loading) saveSettings(settings); }, [settings, loading]);

  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    if (!settings.daily_notification) return;
    const schedule = () => {
      const now = new Date();
      const [h, m] = settings.notification_time.split(':').map(Number);
      const next = new Date(now); next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      notifTimerRef.current = setTimeout(() => {
        const key = getTodayKey();
        const count = state.tasks.filter(t => t.day === key && t.week === 'current').length;
        fireNotification(count === 0 ? "Aucune tâche prévue aujourd'hui — journée libre ♥" : `${count} tâche${count > 1 ? 's' : ''} au programme aujourd'hui`);
        schedule();
      }, next.getTime() - now.getTime());
    };
    schedule();
    return () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); };
  }, [settings.daily_notification, settings.notification_time, state.tasks]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setPrefsOpen(false); }
      if (modal) return;
      if (e.ctrlKey && e.key === 'n' && page === 'tapes') {
        e.preventDefault();
        setModal({ prefillDay: tapeView === 'today' ? todayKey : undefined, prefillWeek: tapeView === 'next' ? 'next' : 'current' });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal, page, tapeView, todayKey]);

  // ── mutations ────────────────────────────────────────────────────────────

  const toggle = useCallback((task: Task) => {
    setState(s => {
      if (task.done) {
        const found = s.done.find(t => t.id === task.id);
        if (!found) return s;
        return { tasks: [...s.tasks, { ...found, done: false }], done: s.done.filter(t => t.id !== task.id) };
      } else {
        const found = s.tasks.find(t => t.id === task.id);
        if (!found) return s;
        return { tasks: s.tasks.filter(t => t.id !== task.id), done: [{ ...found, done: true }, ...s.done] };
      }
    });
  }, []);

  const del = useCallback((task: Task) => {
    setState(s => task.done
      ? { ...s, done:  s.done.filter(x => x.id !== task.id) }
      : { ...s, tasks: s.tasks.filter(x => x.id !== task.id) });
  }, []);

  const openAdd = useCallback((day?: DayKey, week?: WeekKey) => setModal({ prefillDay: day, prefillWeek: week }), []);

  const moveTask = useCallback((task: Task, newDay: DayKey, newWeek: WeekKey) => {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, day: newDay, week: newWeek } : t) }));
  }, []);

  const saveNew = useCallback((data: { name: string; day: DayKey; week: WeekKey; end: DayKey | null; endWeek: WeekKey | null; prio: 1 | 2 | 3 }) => {
    setState(s => ({ ...s, tasks: [...s.tasks, { ...data, id: Math.random().toString(36).slice(2, 9), done: false, recurrence: 'none' as const }] }));
    setModal(null);
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm("Réinitialiser toutes les tâches ?")) return;
    clearAll().then(() => setState(makeSeedState()));
  }, []);

  const handleTweakChange = useCallback((key: keyof TweakSettings, value: TweakSettings[keyof TweakSettings]) => {
    setSettings(s => ({ ...s, [key]: value }));
  }, []);

  const navigate = (id: PageId) => { setPage(id); setMenuOpen(false); };
  const goHome   = () => { setPage('tapes'); setMenuOpen(false); };

  const totals = {
    today:   state.tasks.filter(x => x.day === todayKey && x.week === 'current').length,
    current: state.tasks.filter(x => x.week === 'current').length,
    next:    state.tasks.filter(x => x.week === 'next').length,
    done:    state.done.length,
  };

  if (loading) return <div className="loading-screen">CHARGEMENT…</div>;

  return (
    <div
      className="page"
      style={{ '--accent': settings.accent, '--accent-soft': settings.accent + '33' } as React.CSSProperties}
      data-paper-grid={settings.paper_grid ? '1' : '0'}
      data-density={settings.density}
    >
      {/* overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      {/* drawer */}
      <nav className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}>
        <div className="nav-drawer-header">
          <span className="nav-drawer-title">TO·DO·TAPE</span>
          <button className="nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <ul className="nav-list">
          {NAV.map(item => (
            <li key={item.id}>
              <button
                className={`nav-item ${page === item.id ? 'is-active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-drawer-foot">
          <button className="nav-prefs" onClick={() => { setMenuOpen(false); setPrefsOpen(true); }}>
            ⚙ Préférences
          </button>
        </div>
      </nav>

      {/* ── header ── */}
      <header className="app-header">
        <div className="app-header-left">
          <button className="burger-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <div className="app-brand" onClick={goHome} style={{ cursor: 'pointer' }} title="Retour à l'accueil">
            <span className="brand-tape">▶</span>
            <h1>TO·DO·TAPE</h1>
            <span className="brand-sub">retro groove edition</span>
          </div>
        </div>
        {page === 'tapes' && (
          <div className="app-counters">
            <span><b>{totals.today}</b> aujourd'hui</span>
            <span><b>{totals.current}</b> cette sem.</span>
            <span><b>{totals.next}</b> S+1</span>
            <span><b>{totals.done}</b> ✓</span>
          </div>
        )}
        {page !== 'tapes' && (
          <div className="page-title-pill">
            {NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label}
          </div>
        )}
      </header>

      {/* ── pages secondaires (Dashboard / Archives / Score) ── */}
      {page === 'dashboard' && (
        <main className="canvas secondary-page">
          <DashboardView state={state} currentWeekDates={currentWeekDates} todayKey={todayKey} />
        </main>
      )}
      {page === 'archives' && (
        <main className="canvas secondary-page">
          <ArchivesView state={state} />
        </main>
      )}
      {page === 'score' && (
        <main className="canvas secondary-page">
          <ScoreView state={state} currentWeekDates={currentWeekDates} todayKey={todayKey} />
        </main>
      )}

      {/* ── page principale Mes Tapes ── */}
      {page === 'tapes' && (
        <>
          <div className="toolbar">
            <div className="view-tabs-wrap">
              <div className="view-tabs big view-tabs-top">
                <button className={`view-tab ${tapeView === 'today' ? 'is-active' : ''}`} onClick={() => setTapeView('today')}>
                  AUJOURD'HUI
                </button>
              </div>
              <div className="view-tabs big view-tabs-weeks">
                <button className={`view-tab ${tapeView === 'week' ? 'is-active' : ''}`} onClick={() => setTapeView('week')}>
                  SEMAINE S
                </button>
                <button className={`view-tab ${tapeView === 'next' ? 'is-active' : ''}`} onClick={() => setTapeView('next')}>
                  SEMAINE S+1
                </button>
              </div>
            </div>
            <div className="toolbar-actions">
              <button className="btn-icon" onClick={() => setPrefsOpen(p => !p)} title="Préférences">⚙</button>
              <button className="btn-sketch primary" onClick={() => openAdd(
                tapeView === 'today' ? todayKey : undefined,
                tapeView === 'next' ? 'next' : 'current',
              )}>
                + Nouvelle tâche
              </button>
            </div>
          </div>

          <main className="canvas">
            {tapeView === 'today' && (
              <TodayView state={state} weekDates={currentWeekDates} todayKey={todayKey} onToggle={toggle} onDelete={del} onAdd={openAdd} />
            )}
            {tapeView === 'week' && (
              <WeekView state={state} weekDates={currentWeekDates} weekKey="current" onToggle={toggle} onDelete={del} onAdd={day => openAdd(day, 'current')} onMove={moveTask} />
            )}
            {tapeView === 'next' && (
              <WeekView state={state} weekDates={nextWeekDates} weekKey="next" onToggle={toggle} onDelete={del} onAdd={day => openAdd(day, 'next')} onMove={moveTask} />
            )}
          </main>
        </>
      )}

      <p className="foot-note">♪ vos tâches sont sauvegardées en local · côté A = à faire, côté B = fait ♪</p>
      <p className="foot-sign">By NervyFox</p>

      {modal && (
        <AddTaskModal
          defaults={{ day: modal.prefillDay, week: modal.prefillWeek ?? 'current' }}
          currentWeekDates={currentWeekDates}
          nextWeekDates={nextWeekDates}
          todayKey={todayKey}
          onSave={saveNew}
          onClose={() => setModal(null)}
        />
      )}
      {prefsOpen && (
        <TweaksPanel settings={settings} onChange={handleTweakChange} onReset={handleReset} onClose={() => setPrefsOpen(false)} />
      )}
    </div>
  );
}
