import type { AppState, Task } from './types';

function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Retourne le lundi de la semaine courante en ISO (YYYY-MM-DD)
function getCurrentWeekId(): string {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return monday.toISOString().slice(0, 10); // "2025-06-02"
}

const STORAGE_KEY = 'todotape_recur_week';

function getLastAppliedWeek(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function setLastAppliedWeek(weekId: string): void {
  try { localStorage.setItem(STORAGE_KEY, weekId); } catch {}
}

// N'applique la récurrence QUE si on est sur une nouvelle semaine
export function applyRecurringTasks(state: AppState): AppState {
  const currentWeekId = getCurrentWeekId();
  const lastApplied   = getLastAppliedWeek();

  // Déjà appliqué cette semaine → rien à faire
  if (lastApplied === currentWeekId) return state;

  // recurIds déjà présents en semaine current (non cochées)
  const currentRecurIds = new Set(
    state.tasks
      .filter(t => t.week === 'current' && t.recurrence === 'weekly' && t.recurId)
      .map(t => t.recurId!)
  );

  // Recrée depuis les tâches récurrentes en S+1 qui passent en S
  const toPromote = state.tasks.filter(t =>
    t.week === 'next' &&
    t.recurrence === 'weekly' &&
    t.recurId &&
    !currentRecurIds.has(t.recurId)
  );

  // Recrée depuis les tâches récurrentes cochées (done) — UNIQUEMENT celles de S+1
  // (semaine précédente = elles ont été cochées avant le changement de semaine)
  const doneRecurIds = new Set([...currentRecurIds]);
  const fromDone = state.done.filter(t =>
    t.recurrence === 'weekly' &&
    t.recurId &&
    !doneRecurIds.has(t.recurId)
  );

  const newTasks: Task[] = [
    ...toPromote.map(t => ({ ...t, id: newId(), week: 'current' as const, done: false })),
    ...fromDone.map(t  => ({ ...t, id: newId(), week: 'current' as const, done: false })),
  ];

  // Marquer la semaine comme appliquée même si pas de nouvelles tâches
  setLastAppliedWeek(currentWeekId);

  if (newTasks.length === 0) return state;

  return { ...state, tasks: [...state.tasks, ...newTasks] };
}
