import { useMemo, useState, useRef } from 'react';
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
  onMove: (task: Task, newDay: DayKey) => void;
}

const MONTHS_SHORT = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export function WeekView({ state, weekDates, onToggle, onDelete, onAdd, onMove }: WeekViewProps) {
  const [dragOver, setDragOver] = useState<DayKey | null>(null);
  const dragTask = useRef<Task | null>(null);

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
        {weekDates.map((d, i) => (
          <div
            key={d.key}
            className={`cassette ${d.isToday ? 'today' : ''} ${dragOver === d.key ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(d.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(null);
              if (dragTask.current && dragTask.current.day !== d.key) {
                onMove(dragTask.current, d.key);
              }
              dragTask.current = null;
            }}
          >
            <div className="cassette-label">
              {DAY_NAMES[i]}
            </div>
            <div className="cassette-day">
              <span className="date">
                {d.date.getDate()} {MONTHS_SHORT[d.date.getMonth()]}
              </span>
            </div>
            <div className="cassette-tasks">
              {byDay[d.key].map(t => (
                <MiniTask
                  key={t.id}
                  task={t}
                  weekDates={weekDates}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onDragStart={() => { dragTask.current = t; }}
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
