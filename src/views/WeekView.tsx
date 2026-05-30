import { useMemo, useState } from 'react';
import type { AppState, DayKey, DayMeta, WeekKey } from '../store/types';
import { DAY_KEYS } from '../store/types';
import { MiniTask } from '../components/MiniTask';
import { TaskEditModal } from '../components/TaskEditModal';
import { DoneDrawer } from './DoneDrawer';
import type { Task } from '../store/types';

interface WeekViewProps {
  state: AppState;
  weekDates: DayMeta[];
  weekKey: WeekKey;
  currentWeekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  todayKey: DayKey;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (updated: Task) => void;
  onAdd: (day: DayKey) => void;
}

const MONTHS_SHORT = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export function WeekView({ state, weekDates, weekKey, currentWeekDates, nextWeekDates, todayKey, onToggle, onDelete, onEdit, onAdd }: WeekViewProps) {
  const [editTask, setEditTask] = useState<Task | null>(null);

  const byDay = useMemo(() => {
    const m = Object.fromEntries(DAY_KEYS.map(k => [k, [] as Task[]])) as Record<DayKey, Task[]>;
    for (const t of state.tasks) {
      if (t.week === weekKey) m[t.day].push(t);
    }
    for (const k of DAY_KEYS) m[k].sort((a, b) => b.prio - a.prio);
    return m;
  }, [state.tasks, weekKey]);

  const doneTasks = useMemo(
    () => state.done.filter(t => t.week === weekKey),
    [state.done, weekKey],
  );

  const scopeLabel = weekKey === 'current' ? 'semaine' : 'semaine prochaine';

  return (
    <>
      <div className="cassette-row">
        {weekDates.map((d, i) => (
          <div key={d.key} className={`cassette ${d.isToday ? 'today' : ''}`}>
            <div className="cassette-label">{DAY_NAMES[i]}</div>
            <div className="cassette-day">
              <span className="date">{d.date.getDate()} {MONTHS_SHORT[d.date.getMonth()]}</span>
            </div>
            <div className="cassette-tasks">
              {byDay[d.key].map(t => (
                <MiniTask
                  key={t.id}
                  task={t}
                  currentWeekDates={currentWeekDates}
                  nextWeekDates={nextWeekDates}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={setEditTask}
                />
              ))}
              <button type="button" className="add-line" onClick={e => { e.stopPropagation(); onAdd(d.key); }}>
                + ajouter…
              </button>
            </div>
          </div>
        ))}
      </div>

      <DoneDrawer items={doneTasks} scope={scopeLabel} onToggle={onToggle} onDelete={onDelete} />

      {editTask && (
        <TaskEditModal
          task={editTask}
          currentWeekDates={currentWeekDates}
          nextWeekDates={nextWeekDates}
          todayKey={todayKey}
          onSave={updated => { onEdit(updated); setEditTask(null); }}
          onDelete={t => { onDelete(t); setEditTask(null); }}
          onClose={() => setEditTask(null)}
        />
      )}
    </>
  );
}
