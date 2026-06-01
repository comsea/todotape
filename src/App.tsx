import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AppState, TweakSettings, DayKey, DayMeta, WeekKey } from './store/types';
import { DAYS, DAY_KEYS, MONTHS_FR, DEFAULT_SETTINGS } from './store/types';
import { loadState, saveState, loadSettings, saveSettings, clearAll, maybeArchivePreviousWeek } from './store/persistence';
import { makeSeedState } from './store/seed';
import { loadXP, saveXP, getGrade, getNextGrade, xpForTask, STREAK_BONUS } from './store/xp';
import type { XPState } from './store/xp';
import { applyRecurringTasks } from './store/recurrence';
import { WeekView }      from './views/WeekView';
import { TodayView }     from './views/TodayView';
import { DashboardView } from './views/DashboardView';
import { ArchivesView }  from './views/ArchivesView';
import { GradeView }     from './views/GradeView';
import { SettingsView }  from './views/SettingsView';import { AddTaskModal }  from './components/AddTaskModal';
import { TweaksPanel }   from './components/TweaksPanel';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { InstallBanner }    from './components/InstallBanner';
import { APP_VERSION } from './version';
import { SplashScreen } from './components/SplashScreen';
import { IconTapes, IconGrade, IconDashboard, IconArchives, IconSettings } from './components/NavIcons';
import type { Task } from './store/types';
type PageId = 'tapes' | 'dashboard' | 'archives' | 'grade' | 'settings';
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
      ...d, date,
      label: `${String(date.getDate()).padStart(2, '0')} ${MONTHS_FR[date.getMonth()]}`,
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

function getTodayKey(): DayKey {
  return DAY_KEYS[(new Date().getDay() + 6) % 7];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

const NAV: Array<{ id: PageId; label: string; Icon: React.FC<{ active?: boolean; size?: number }> }> = [
  { id: 'tapes',     label: 'Mes tapes',       Icon: IconTapes     },
  { id: 'grade',     label: 'Grade & XP',       Icon: IconGrade     },
  { id: 'dashboard', label: 'Tableau de bord',  Icon: IconDashboard },
  { id: 'archives',  label: 'Archives',          Icon: IconArchives  },
  { id: 'settings',  label: 'Paramètres',        Icon: IconSettings  },
];

export function App() {
  const [loading, setLoading]     = useState(true);
  const [splash, setSplash]       = useState(true);
  const [state, setState]         = useState<AppState>({ tasks: [], done: [] });
  const [settings, setSettings]   = useState<TweakSettings>(DEFAULT_SETTINGS);
  const [xp, setXP]               = useState<XPState>({ total: 0, lastStreakDate: null });
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const [page, setPage]           = useState<PageId>('tapes');
  const [tapeView, setTapeView]   = useState<TapeView>('week');

  const [menuOpen, setMenuOpen]   = useState(false);
  const [modal, setModal]         = useState<{ prefillDay?: DayKey; prefillWeek?: WeekKey } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const currentWeekDates = useMemo(() => computeWeek(0), []);
  const nextWeekDates    = useMemo(() => computeWeek(1), []);
  const [todayKey, setTodayKey]   = useState<DayKey>(getTodayKey);

  useEffect(() => {
    const ms = () => { const n = new Date(), m = new Date(n); m.setHours(24,0,0,0); return m.getTime()-n.getTime(); };
    const t = setTimeout(() => setTodayKey(getTodayKey()), ms());
    return () => clearTimeout(t);
  }, [todayKey]);

  useEffect(() => {
    Promise.all([loadState(), loadSettings(), loadXP()]).then(([s, cfg, x]) => {
      const sWithRecurring = applyRecurringTasks(s);
      setState(sWithRecurring);
      setSettings(cfg);
      setXP(x);
      // Appliquer la vue par défaut
      if (cfg.default_view === 'today' || cfg.default_view === 'week' || cfg.default_view === 'next') {
        setTapeView(cfg.default_view);
      }
      setLoading(false);
      maybeArchivePreviousWeek(s);
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
  useEffect(() => { if (!loading) saveXP(xp); }, [xp, loading]);

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

  // ── XP : ajouter des points ───────────────────────────────────────────────

  const addXP = useCallback((task: Task) => {
    setXP(prev => {
      const earned = xpForTask(task.prio);
      const prevGrade = getGrade(prev.total);

      // Bonus streak si premier check du jour
      const today = todayISO();
      const streakBonus = prev.lastStreakDate !== today ? STREAK_BONUS : 0;
      const newTotal = prev.total + earned + streakBonus;
      const newGrade = getGrade(newTotal);

      // Level up ?
      if (newGrade.name !== prevGrade.name) {
        setLevelUpMsg(`🎉 NOUVEAU GRADE : ${newGrade.icon} ${newGrade.name.toUpperCase()} !`);
        setTimeout(() => setLevelUpMsg(null), 4000);
      }

      return { total: newTotal, lastStreakDate: today };
    });
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const toggle = useCallback((task: Task) => {
    setState(s => {
      if (task.done) {
        const found = s.done.find(t => t.id === task.id);
        if (!found) return s;
        return { tasks: [...s.tasks, { ...found, done: false }], done: s.done.filter(t => t.id !== task.id) };
      } else {
        const found = s.tasks.find(t => t.id === task.id);
        if (!found) return s;
        addXP(found); // ← XP gagné ici
        return { tasks: s.tasks.filter(t => t.id !== task.id), done: [{ ...found, done: true }, ...s.done] };
      }
    });
  }, [addXP]);

  const del = useCallback((task: Task) => {
    setState(s => task.done
      ? { ...s, done:  s.done.filter(x => x.id !== task.id) }
      : { ...s, tasks: s.tasks.filter(x => x.id !== task.id) });
  }, []);

  const openAdd = useCallback((day?: DayKey, week?: WeekKey) => setModal({ prefillDay: day, prefillWeek: week }), []);

  const editTask = useCallback((updated: Task) => {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === updated.id ? updated : t) }));
  }, []);

  const saveNew = useCallback((data: { name: string; day: DayKey; week: WeekKey; end: DayKey | null; endWeek: WeekKey | null; prio: 1 | 2 | 3; recurrence: 'none' | 'weekly'; recurId?: string }) => {
    setState(s => ({ ...s, tasks: [...s.tasks, { ...data, id: Math.random().toString(36).slice(2, 9), done: false }] }));
    setModal(null);
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm("Réinitialiser toutes les tâches ?")) return;
    clearAll().then(() => setState(makeSeedState()));
  }, []);

  const handleResetXP = useCallback(() => {
    setXP({ total: 0, lastStreakDate: null });
  }, []);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ tasks: state.tasks, done: state.done }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `todotape-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }, [state]);

  const handleImport = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed.tasks)) { alert('Fichier invalide'); return; }
      if (!confirm('Remplacer toutes les tâches par celles du fichier ?')) return;
      setState({ tasks: parsed.tasks, done: parsed.done ?? [] });
    } catch { alert('Fichier JSON invalide'); }
  }, []);

  const handleTweakChange = useCallback((key: keyof TweakSettings, value: TweakSettings[keyof TweakSettings]) => {
    setSettings(s => ({ ...s, [key]: value }));
  }, []);

  const navigate = (id: PageId) => { setPage(id); setMenuOpen(false); };
  const goHome   = () => { setPage('tapes'); setMenuOpen(false); };

  const { needRefresh, updateServiceWorker } = useServiceWorker();
  const { canInstall, isIOS, triggerInstall, share } = useInstallPrompt();
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // ── Données dérivées ──────────────────────────────────────────────────────

  const totals = {
    today:   state.tasks.filter(x => x.day === todayKey && x.week === 'current').length,
    current: state.tasks.filter(x => x.week === 'current').length,
    next:    state.tasks.filter(x => x.week === 'next').length,
    done:    state.done.length,
  };

  const grade    = getGrade(xp.total);
  const nextGrade = getNextGrade(xp.total);
  const xpInGrade    = nextGrade ? xp.total - grade.minXP : 0;
  const xpNeededFull = nextGrade ? nextGrade.minXP - grade.minXP : 1;
  const xpProgress   = nextGrade ? Math.round((xpInGrade / xpNeededFull) * 100) : 100;

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (loading) return <div className="loading-screen">CHARGEMENT…</div>;

  return (
    <div
      className="page"
      style={{ '--accent': settings.accent, '--accent-soft': settings.accent + '33' } as React.CSSProperties}
      data-paper-grid={settings.paper_grid ? '1' : '0'}
      data-density={settings.density}
    >
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ── Bannière level up ── */}
      {levelUpMsg && (
        <div className="levelup-banner">{levelUpMsg}</div>
      )}

      {/* ── Bannière installation ── */}
      {showInstallBanner && (canInstall || isIOS) && (
        <InstallBanner
          canInstall={canInstall}
          isIOS={isIOS}
          onInstall={() => { triggerInstall(); setShowInstallBanner(false); }}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}

      {/* ── Bannière PWA update ── */}
      {needRefresh && (
        <div className="pwa-update-banner">
          <span className="pwa-update-icon">📼</span>
          <span className="pwa-update-text">Nouvelle version disponible !</span>
          <button className="pwa-update-btn" onClick={() => updateServiceWorker(true)}>▶ RECHARGER</button>
        </div>
      )}

      {/* ── Drawer ── */}
      <nav className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}>
        <div className="nav-drawer-header">
          <span className="nav-drawer-title">TODOTAPE</span>
          <button className="nav-close" onClick={() => setMenuOpen(false)}>✕</button>
          <div className="nav-header-row">
            <span>▶ RETRO GROOVE</span>
          </div>
        </div>
        <ul className="nav-list">
          {NAV.map((item, i) => (
            <li key={item.id}>
              <button className={`nav-item ${page === item.id ? 'is-active' : ''}`} onClick={() => navigate(item.id)}>
                <span className="nav-icon"><item.Icon active={page === item.id} size={22} /></span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-track">0{i + 1}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-drawer-foot">
          <div style={{ fontFamily: 'VT323, monospace', fontSize: '14px', color: '#2a2724', textAlign: 'center', letterSpacing: '1px' }}>
            v{APP_VERSION} · NervyFox
          </div>
        </div>
      </nav>

      {/* ── Header nettoyé ── */}
      <header className="app-header">
        <div className="app-header-left">
          <button className="burger-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <div className="app-brand" onClick={goHome} style={{ cursor: 'pointer' }} title="Accueil">
            <svg className="brand-svg" viewBox="0 0 210 68" xmlns="http://www.w3.org/2000/svg">
              {/* Boîtier cassette */}
              <rect x="1" y="1" width="140" height="52" rx="6" fill="#2a2724" stroke="#ff2d8a" strokeWidth="1.5"/>
              <rect x="1" y="1" width="140" height="10" rx="6" fill="#333028"/>
              <rect x="1" y="7" width="140" height="4" fill="#333028"/>
              {/* Fenêtre */}
              <rect x="16" y="14" width="108" height="32" rx="4" fill="#111" stroke="#3a3835" strokeWidth="1"/>
              {/* Bobine gauche */}
              <circle cx="46" cy="30" r="12" fill="#1e1d1a" stroke="#ff2d8a" strokeWidth="1.5"/>
              <circle cx="46" cy="30" r="5" fill="#111" stroke="#3a3835" strokeWidth="1"/>
              <line x1="46" y1="19" x2="46" y2="25" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="46" y1="35" x2="46" y2="41" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="35" y1="30" x2="41" y2="30" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="51" y1="30" x2="57" y2="30" stroke="#ff2d8a" strokeWidth="1"/>
              {/* Bobine droite */}
              <circle cx="96" cy="30" r="12" fill="#1e1d1a" stroke="#ff2d8a" strokeWidth="1.5"/>
              <circle cx="96" cy="30" r="5" fill="#111" stroke="#3a3835" strokeWidth="1"/>
              <line x1="96" y1="19" x2="96" y2="25" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="96" y1="35" x2="96" y2="41" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="85" y1="30" x2="91" y2="30" stroke="#ff2d8a" strokeWidth="1"/>
              <line x1="101" y1="30" x2="107" y2="30" stroke="#ff2d8a" strokeWidth="1"/>
              {/* Ruban */}
              <path d="M 58 30 Q 71 38 84 30" fill="none" stroke="#8B7355" strokeWidth="1.5"/>
              {/* Trous */}
              <circle cx="10" cy="8" r="3" fill="#111" stroke="#3a3835" strokeWidth="0.8"/>
              <circle cx="132" cy="8" r="3" fill="#111" stroke="#3a3835" strokeWidth="0.8"/>
              <circle cx="10" cy="46" r="3" fill="#111" stroke="#3a3835" strokeWidth="0.8"/>
              <circle cx="132" cy="46" r="3" fill="#111" stroke="#3a3835" strokeWidth="0.8"/>
              {/* TODOTAPE texte */}
              <text x="71" y="64" textAnchor="middle" fontFamily="Boogaloo, cursive" fontSize="22" fontWeight="700" fill="#ff2d8a" letterSpacing="1">TODOTAPE</text>
            </svg>
          </div>
        </div>
        {page !== 'tapes' && (
          <div className="page-title-pill">
            {NAV.find(n => n.id === page)?.label}
          </div>
        )}
      </header>

      {/* ── Barre XP sous le header (page tapes uniquement) ── */}
      {page === 'tapes' && (
        <div className="xp-bar-wrap" onClick={() => navigate('grade')} title="Voir mon grade">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="xp-grade-badge">
            <span className="xp-grade-name">{grade.name}</span>
          </div>
        </div>
      )}

      {/* ── Pages secondaires ── */}
      {page === 'grade' && (
        <main className="canvas secondary-page"><GradeView xp={xp} /></main>
      )}
      {page === 'dashboard' && (
        <main className="canvas secondary-page"><DashboardView state={state} currentWeekDates={currentWeekDates} todayKey={todayKey} /></main>
      )}
      {page === 'archives' && (
        <main className="canvas secondary-page"><ArchivesView state={state} /></main>
      )}
      {page === 'settings' && (
        <main className="canvas secondary-page">
          <SettingsView
            settings={settings}
            xp={xp}
            onChange={handleTweakChange}
            onResetTasks={handleReset}
            onResetXP={handleResetXP}
            onExport={handleExport}
            onImport={handleImport}
            onShare={share}
            onInstall={canInstall ? triggerInstall : undefined}
            canInstall={canInstall}
          />
        </main>
      )}

      {/* ── Page principale Mes Tapes ── */}
      {page === 'tapes' && (
        <>
          <div className="toolbar">
            <div className="view-tabs-wrap">
              <div className="view-tabs big view-tabs-top">
                <button className={`view-tab ${tapeView === 'today' ? 'is-active' : ''}`} onClick={() => setTapeView('today')}>AUJOURD'HUI</button>
              </div>
              <div className="view-tabs big view-tabs-weeks">
                <button className={`view-tab ${tapeView === 'week' ? 'is-active' : ''}`} onClick={() => setTapeView('week')}>SEMAINE S</button>
                <button className={`view-tab ${tapeView === 'next' ? 'is-active' : ''}`} onClick={() => setTapeView('next')}>SEMAINE S+1</button>
              </div>
            </div>
            <div className="toolbar-actions">
              <button className="btn-sketch primary" onClick={() => openAdd(
                tapeView === 'today' ? todayKey : undefined,
                tapeView === 'next' ? 'next' : 'current',
              )}>+ Nouvelle tâche</button>
            </div>
          </div>

          <main className="canvas">
            {tapeView === 'today' && <TodayView state={state} weekDates={currentWeekDates} nextWeekDates={nextWeekDates} todayKey={todayKey} onToggle={toggle} onDelete={del} onEdit={editTask} onAdd={openAdd} />}
            {tapeView === 'week'  && <WeekView state={state} weekDates={currentWeekDates} weekKey="current" currentWeekDates={currentWeekDates} nextWeekDates={nextWeekDates} todayKey={todayKey} onToggle={toggle} onDelete={del} onEdit={editTask} onAdd={day => openAdd(day, 'current')} />}
            {tapeView === 'next'  && <WeekView state={state} weekDates={nextWeekDates} weekKey="next" currentWeekDates={currentWeekDates} nextWeekDates={nextWeekDates} todayKey={todayKey} onToggle={toggle} onDelete={del} onEdit={editTask} onAdd={day => openAdd(day, 'next')} />}
          </main>

          {/* Compteurs déplacés en bas */}
          <div className="bottom-counters">
            <span><b>{totals.today}</b> aujourd'hui</span>
            <span><b>{totals.current}</b> cette sem.</span>
            <span><b>{totals.next}</b> S+1</span>
            <span><b>{totals.done}</b> ✓ terminées</span>
          </div>
        </>
      )}

      <p className="foot-note">♪ vos tâches sont sauvegardées en local · côté A = à faire, côté B = fait ♪</p>
      <p className="foot-sign">By NervyFox <span className="foot-version">v{APP_VERSION}</span></p>

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
