import { useMemo } from 'react';
import type { AppState, DayKey, DayMeta } from '../store/types';
import { DAY_KEYS } from '../store/types';
import { MiniTask } from '../components/MiniTask';
import { DoneDrawer } from './DoneDrawer';
import type { Task } from '../store/types';

interface WeekViewProps {
  state: AppState;
  weekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAdd: (day: DayKey) => void;
}

export function WeekView({ state, weekDates, onToggle, onDelete, onAdd }: WeekViewProps) {
  const byDay = useMemo(() => {
    const m = Object.fromEntries(DAY_KEYS.map(k => [k, [] as Task[]])) as Record<DayKey, Task[]>;
    for (const t of state.tasks) {
      m[t.day].push(t);
    }
    for (const k of DAY_KEYS) {
      m[k].sort((a, b) => b.prio - a.prio);
    }
    return m;
  }, [state.tasks]);

  return (
    <>
      <div className="cassette-row">
        {weekDates.map(d => (
          <div key={d.key} className={`cassette ${d.isToday ? 'today' : ''}`}>
            <div className="cassette-label">SIDE&nbsp;{d.short[0]}</div>
            <div className="cassette-day">
              {d.short}
              <span className="date">{d.label}</span>
            </div>
            <div className="cassette-tasks">
              {byDay[d.key].map(t => (
                <MiniTask
                  key={t.id}
                  task={t}
                  weekDates={weekDates}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
              <button
                type="button"
                className="add-line"
                onClick={() => onAdd(d.key)}
              >
                + ajouter…
              </button>
            </div>
          </div>
        ))}
      </div>

      <DoneDrawer
        items={state.done}
        scope="semaine"
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </>
  );
}
