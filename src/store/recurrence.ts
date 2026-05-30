import type { AppState, Task } from './types';

function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Au début de chaque nouvelle semaine, recrée les tâches récurrentes
// depuis les tâches de S+1 ou depuis les done de S précédente
export function applyRecurringTasks(state: AppState): AppState {
  // Trouve toutes les tâches récurrentes déjà présentes en semaine "current"
  const currentRecurIds = new Set(
    state.tasks
      .filter(t => t.week === 'current' && t.recurrence === 'weekly' && t.recurId)
      .map(t => t.recurId!)
  );

  // Cherche les tâches récurrentes en S+1 qui n'ont pas encore leur équivalent en S
  // (cas où on avance d'une semaine : S+1 devient S)
  const toPromote = state.tasks.filter(t =>
    t.week === 'next' &&
    t.recurrence === 'weekly' &&
    t.recurId &&
    !currentRecurIds.has(t.recurId)
  );

  // Cherche aussi dans les done de S (tâches récurrentes cochées la semaine passée)
  const doneRecurIds = new Set(
    state.tasks
      .filter(t => t.week === 'current' && t.recurrence === 'weekly' && t.recurId)
      .map(t => t.recurId!)
  );

  const fromDone = state.done.filter(t =>
    t.recurrence === 'weekly' &&
    t.recurId &&
    !doneRecurIds.has(t.recurId) &&
    !currentRecurIds.has(t.recurId)
  );

  const newTasks: Task[] = [
    ...toPromote.map(t => ({ ...t, id: newId(), week: 'current' as const, done: false })),
    ...fromDone.map(t => ({ ...t, id: newId(), week: 'current' as const, done: false })),
  ];

  if (newTasks.length === 0) return state;

  return { ...state, tasks: [...state.tasks, ...newTasks] };
}
