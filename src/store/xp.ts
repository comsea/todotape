// ── Système XP / Grades ──────────────────────────────────────────────────────

export interface XPState {
  total: number;
  lastStreakDate: string | null; // ISO date du dernier bonus streak
}

export interface Grade {
  name: string;
  icon: string;
  minXP: number;
}

export const GRADES: Grade[] = [
  { name: 'Stagiaire',  icon: '📼',  minXP: 0    },
  { name: 'Beatmaker',  icon: '🎹',  minXP: 100  },
  { name: 'DJ',         icon: '🎧',  minXP: 300  },
  { name: 'Producteur', icon: '🎚',  minXP: 600  },
  { name: 'Artiste',    icon: '🎤',  minXP: 1000 },
  { name: 'Headliner',  icon: '🎸',  minXP: 2000 },
  { name: 'Légende',    icon: '🌟',  minXP: 4000 },
];

export function getGrade(xp: number): Grade {
  return [...GRADES].reverse().find(g => xp >= g.minXP) ?? GRADES[0];
}

export function getNextGrade(xp: number): Grade | null {
  return GRADES.find(g => g.minXP > xp) ?? null;
}

export function xpForTask(prio: 1 | 2 | 3): number {
  return prio === 1 ? 10 : prio === 2 ? 25 : 50;
}

export const STREAK_BONUS = 15;

// Persistance XP
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadXP(): Promise<XPState> {
  try {
    if (isTauri) {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('todotape.json', { autoSave: false });
      const x = await store.get<XPState>('xp');
      if (x) return x;
    } else {
      const raw = localStorage.getItem('todotape_xp');
      if (raw) return JSON.parse(raw) as XPState;
    }
  } catch {}
  return { total: 0, lastStreakDate: null };
}

export async function saveXP(xp: XPState): Promise<void> {
  try {
    if (isTauri) {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('todotape.json', { autoSave: false });
      await store.set('xp', xp);
      await store.save();
    } else {
      localStorage.setItem('todotape_xp', JSON.stringify(xp));
    }
  } catch {}
}
