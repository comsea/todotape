import { useMemo, useState } from 'react';
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
  const [selected, setSelected] = useState<Task | null>(null);

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

  function handleTaskClick(task: Task) {
    if (selected?.id === task.id) {
      setSelected(null); // désélectionne si on reclique
    } else {
      setSelected(task);
    }
  }

  function handleDayClick(dayKey: DayKey) {
    if (!selected) return;
    if (selected.day !== dayKey) {
      onMove(selected, dayKey);
    }
    setSelected(null);
  }

  return (
    <>
      {selected && (
        <div style={{
          textAlign: 'center',
          padding: '6px',
          marginBottom: '8px',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          ✦ «{selected.name}» sélectionnée — clique sur un jour pour la déplacer, ou reclique sur la tâche pour annuler
        </div>
      )}
      <div className="cassette-row">
        {weekDates.map((d, i) => (
          <div
            key={d.key}
            className={`cassette ${d.isToday ? 'today' : ''} ${selected && selected.day !== d.key ? 'drop-target' : ''}`}
            onClick={() => handleDayClick(d.key)}
            style={selected && selected.day !== d.key ? { cursor: 'pointer', outline: '2px dashed var(--accent)' } : {}}
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
                  onSelect={handleTaskClick}
                  isSelected={selected?.id === t.id}
                />
              ))}
              <button
                type="button"
                className="add-line"
                onClick={e => { e.stopPropagation(); onAdd(d.key); }}
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
