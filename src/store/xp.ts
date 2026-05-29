export interface XPState {
  total: number;
  lastStreakDate: string | null;
}

export interface Grade {
  name: string;
  icon: string;
  minXP: number;
}

export const GRADES: Grade[] = [
  { name: 'Stagiaire',          icon: '📼',  minXP: 0     },
  { name: 'Cassettiste',        icon: '🎵',  minXP: 50    },
  { name: 'Beatmaker',          icon: '🥁',  minXP: 150   },
  { name: 'Samplneur',          icon: '🎹',  minXP: 300   },
  { name: 'Loopeur',            icon: '🔁',  minXP: 500   },
  { name: 'Arrangeur',          icon: '🎼',  minXP: 750   },
  { name: 'DJ',                 icon: '🎧',  minXP: 1100  },
  { name: 'Mixeur',             icon: '🎚',  minXP: 1500  },
  { name: 'Beatboxer',          icon: '🎤',  minXP: 2000  },
  { name: 'Compositeur',        icon: '🎸',  minXP: 2700  },
  { name: 'Producteur',         icon: '🖥',  minXP: 3600  },
  { name: 'Arrangeur Pro',      icon: '🎻',  minXP: 4700  },
  { name: 'Directeur Musical',  icon: '🎷',  minXP: 6000  },
  { name: 'Artiste',            icon: '🌟',  minXP: 7500  },
  { name: 'Headliner',          icon: '🎪',  minXP: 9500  },
  { name: 'Superstar',          icon: '💫',  minXP: 12000 },
  { name: 'Icône',              icon: '👑',  minXP: 15000 },
  { name: 'Légende',            icon: '🏆',  minXP: 19000 },
  { name: 'Mythique',           icon: '⚡',  minXP: 24000 },
  { name: 'Dieu du Groove',     icon: '🌈',  minXP: 30000 },
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

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadXP(): Promise<XPState> {
  try {
    if (isTauri) {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('todotape.json', { defaults: {}, autoSave: false });
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
      const store = await Store.load('todotape.json', { defaults: {}, autoSave: false });
      await store.set('xp', xp);
      await store.save();
    } else {
      localStorage.setItem('todotape_xp', JSON.stringify(xp));
    }
  } catch {}
}
