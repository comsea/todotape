import type { AppState, TweakSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { makeSeedState } from './seed';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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
      const tasks = await store.get<AppState['tasks']>('tasks');
      const done  = await store.get<AppState['done']>('done');
      if (Array.isArray(tasks) && Array.isArray(done)) return { tasks, done };
    } else {
      const raw = localStorage.getItem('todotape_v1');
      if (raw) {
        const p = JSON.parse(raw) as Partial<AppState>;
        if (Array.isArray(p.tasks) && Array.isArray(p.done)) return p as AppState;
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
