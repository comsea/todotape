import type { AppState, Task, TweakSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { makeSeedState } from './seed';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ── migration : ajoute week/endWeek aux anciennes tâches ────────────────────

function migrateTask(t: Task): Task {
  return {
    ...t,
    week: t.week ?? 'current',
    endWeek: t.endWeek ?? null,
  };
}

function migrateState(raw: Partial<AppState>): AppState {
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(migrateTask) : [];
  const done  = Array.isArray(raw.done)  ? raw.done.map(migrateTask)  : [];
  return { tasks, done };
}

// ── Tauri store (lazy init) ──────────────────────────────────────────────────

let _storePromise: Promise<import('@tauri-apps/plugin-store').Store> | null = null;

async function getStore() {
  if (!_storePromise) {
    const { Store } = await import('@tauri-apps/plugin-store');
    _storePromise = Store.load('todotape.json', { defaults: {}, autoSave: false });
  }
  return _storePromise;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function loadState(): Promise<AppState> {
  try {
    if (isTauri) {
      const store = await getStore();
      const tasks = await store.get<Task[]>('tasks');
      const done  = await store.get<Task[]>('done');
      if (Array.isArray(tasks) && Array.isArray(done))
        return migrateState({ tasks, done });
    } else {
      const raw = localStorage.getItem('todotape_v1');
      if (raw) {
        const p = JSON.parse(raw) as Partial<AppState>;
        if (Array.isArray(p.tasks) && Array.isArray(p.done))
          return migrateState(p);
      }
    }
  } catch (e) {
    console.error('Failed to load state, using seed data', e);
  }
  return makeSeedState();
}

export async function saveState(state: AppState): Promise<void> {
  try {
    if (isTauri) {
      const store = await getStore();
      await store.set('tasks', state.tasks);
      await store.set('done', state.done);
      await store.save();
    } else {
      localStorage.setItem('todotape_v1', JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function loadSettings(): Promise<TweakSettings> {
  try {
    if (isTauri) {
      const store = await getStore();
      const s = await store.get<TweakSettings>('settings');
      if (s && typeof s === 'object') return { ...DEFAULT_SETTINGS, ...s };
    } else {
      const raw = localStorage.getItem('todotape_settings');
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<TweakSettings> };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: TweakSettings): Promise<void> {
  try {
    if (isTauri) {
      const store = await getStore();
      await store.set('settings', settings);
      await store.save();
    } else {
      localStorage.setItem('todotape_settings', JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  try {
    if (isTauri) {
      const store = await getStore();
      await store.delete('tasks');
      await store.delete('done');
      await store.save();
    } else {
      localStorage.removeItem('todotape_v1');
    }
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
}

// ── Archives ─────────────────────────────────────────────────────────────────

export interface WeekArchive {
  weekId: string;       // "2025-W21"
  mondayISO: string;    // ISO de lundi
  label: string;        // "19 MAI – 25 MAI 2025"
  month: number;        // 0-11
  year: number;
  total: number;
  done: number;
  score: number;        // 0-100
  archivedAt: string;
}

function getWeekId(monday: Date): string {
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((monday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

const MONTHS_FR_SHORT = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];

function weekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const d1 = monday.getDate(), m1 = MONTHS_FR_SHORT[monday.getMonth()];
  const d2 = sunday.getDate(), m2 = MONTHS_FR_SHORT[sunday.getMonth()];
  const yr = sunday.getFullYear();
  return monday.getMonth() === sunday.getMonth()
    ? `${d1} – ${d2} ${m1} ${yr}`
    : `${d1} ${m1} – ${d2} ${m2} ${yr}`;
}

export function getCurrentMonday(): Date {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getPreviousMonday(): Date {
  const m = getCurrentMonday();
  m.setDate(m.getDate() - 7);
  return m;
}

export async function loadArchives(): Promise<WeekArchive[]> {
  try {
    if (isTauri) {
      const store = await getStore();
      const a = await store.get<WeekArchive[]>('archives');
      if (Array.isArray(a)) return a;
    } else {
      const raw = localStorage.getItem('todotape_archives');
      if (raw) return JSON.parse(raw) as WeekArchive[];
    }
  } catch (e) {
    console.error('Failed to load archives', e);
  }
  return [];
}

export async function saveArchives(archives: WeekArchive[]): Promise<void> {
  try {
    if (isTauri) {
      const store = await getStore();
      await store.set('archives', archives);
      await store.save();
    } else {
      localStorage.setItem('todotape_archives', JSON.stringify(archives));
    }
  } catch (e) {
    console.error('Failed to save archives', e);
  }
}

// Appelé au démarrage : archive la semaine précédente si pas encore fait
export async function maybeArchivePreviousWeek(state: AppState): Promise<WeekArchive | null> {
  const prevMonday = getPreviousMonday();
  const weekId = getWeekId(prevMonday);
  const existing = await loadArchives();

  // déjà archivée ?
  if (existing.find(a => a.weekId === weekId)) return null;

  // tâches de la semaine précédente (done uniquement — les non-faites sont perdues intentionnellement)
  const doneTasks = state.done.filter(t => t.week === 'current');
  const total = state.tasks.filter(t => t.week === 'current').length + doneTasks.length;
  const done  = doneTasks.length;

  // Si rien du tout → pas d'archivage (utilisateur n'a pas encore utilisé l'app cette semaine-là)
  if (total === 0 && done === 0) return null;

  const archive: WeekArchive = {
    weekId,
    mondayISO: prevMonday.toISOString(),
    label: weekLabel(prevMonday),
    month: prevMonday.getMonth(),
    year: prevMonday.getFullYear(),
    total,
    done,
    score: total === 0 ? 0 : Math.round((done / total) * 100),
    archivedAt: new Date().toISOString(),
  };

  await saveArchives([...existing, archive]);
  return archive;
}
