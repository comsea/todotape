export type DayKey = 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim';
export type WeekKey = 'current' | 'next';

export interface Task {
  id: string;
  name: string;
  day: DayKey;
  week: WeekKey;   // ← nouveau
  end: DayKey | null;
  endWeek: WeekKey | null; // ← nouveau
  prio: 1 | 2 | 3;
  done: boolean;
}

export interface AppState {
  tasks: Task[];
  done: Task[];
}

export interface TweakSettings {
  accent: string;
  paper_grid: boolean;
  density: 'compact' | 'regular' | 'aéré';
  default_view: 'week' | 'next' | 'today';
  daily_notification: boolean;
  notification_time: string;
  start_with_windows: boolean;
}

export interface DayMeta {
  key: DayKey;
  name: string;
  short: string;
  date: Date;
  label: string;
  isToday: boolean;
}

export const DAYS: Array<{ key: DayKey; name: string; short: string }> = [
  { key: 'lun', name: 'LUNDI',    short: 'LUN' },
  { key: 'mar', name: 'MARDI',    short: 'MAR' },
  { key: 'mer', name: 'MERCREDI', short: 'MER' },
  { key: 'jeu', name: 'JEUDI',    short: 'JEU' },
  { key: 'ven', name: 'VENDREDI', short: 'VEN' },
  { key: 'sam', name: 'SAMEDI',   short: 'SAM' },
  { key: 'dim', name: 'DIMANCHE', short: 'DIM' },
];

export const DAY_KEYS: DayKey[] = DAYS.map(d => d.key);
export const MONTHS_FR = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];

export const DEFAULT_SETTINGS: TweakSettings = {
  accent: '#ff2d8a',
  paper_grid: true,
  density: 'regular',
  default_view: 'week',
  daily_notification: false,
  notification_time: '09:00',
  start_with_windows: false,
};
