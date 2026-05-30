import { useMemo, useState, useEffect, useRef } from 'react';
import type { AppState, DayKey, DayMeta, Task } from '../store/types';
import { BigTask } from '../components/BigTask';
import { DoneItem } from '../components/DoneItem';
import { TaskEditModal } from '../components/TaskEditModal';

interface TodayViewProps {
  state: AppState;
  weekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  todayKey: DayKey;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (updated: Task) => void;
  onAdd: (day: DayKey) => void;
}

export function TodayView({ state, weekDates, nextWeekDates, todayKey, onToggle, onDelete, onEdit, onAdd }: TodayViewProps) {
  const todayMeta  = weekDates.find(d => d.key === todayKey)!;
  const todayTasks = useMemo(
    () => state.tasks.filter(t => t.day === todayKey && t.week === 'current').sort((a, b) => b.prio - a.prio),
    [state.tasks, todayKey],
  );
  const todayDone = useMemo(
    () => state.done.filter(t => t.day === todayKey && t.week === 'current'),
    [state.done, todayKey],
  );

  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [editTask, setEditTask]     = useState<Task | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!listRef.current?.contains(document.activeElement) && focusedIdx === null) return;
      if (todayTasks.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => (i === null ? 0 : Math.min(i + 1, todayTasks.length - 1))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => (i === null ? todayTasks.length - 1 : Math.max(i - 1, 0))); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [todayTasks.length, focusedIdx]);

  const minutes = todayTasks.length * 25;

  return (
    <div className="today-wrap">
      <div className="cassette-big">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ {todayMeta.name} {todayMeta.label} ★</span>
          <span className="spool" />
        </div>
        <div className="cassette-big-title">FACE A — À FAIRE</div>
        <div className="cassette-big-sub">
          {todayTasks.length === 0
            ? 'aucun morceau · cassette vierge ♥'
            : `${todayTasks.length} morceau${todayTasks.length > 1 ? 'x' : ''} · ~${minutes} min de boulot`}
        </div>

        <div className="cassette-big-tasks" ref={listRef}>
          {todayTasks.map((t, i) => (
            <BigTask
              key={t.id}
              task={t}
              currentWeekDates={weekDates}
              nextWeekDates={nextWeekDates}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={setEditTask}
              focused={focusedIdx === i}
              tabIndex={0}
              onFocus={() => setFocusedIdx(i)}
            />
          ))}
          <button type="button" className="add-big" onClick={() => onAdd(todayKey)}>
            + ajouter un morceau à aujourd'hui
          </button>
        </div>
      </div>

      <div className="done-drawer">
        <div className="done-drawer-header">
          <span>✓ FACE B — DÉJÀ FAIT AUJOURD'HUI</span>
          <span className="count">{todayDone.length}</span>
        </div>
        {todayDone.length === 0
          ? <div className="empty-note">rien de coché aujourd'hui pour l'instant…</div>
          : <div className="done-list">{todayDone.map(t => <DoneItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />)}</div>
        }
      </div>

      {editTask && (
        <TaskEditModal
          task={editTask}
          currentWeekDates={weekDates}
          nextWeekDates={nextWeekDates}
          todayKey={todayKey}
          onSave={updated => { onEdit(updated); setEditTask(null); }}
          onDelete={t => { onDelete(t); setEditTask(null); }}
          onClose={() => setEditTask(null)}
        />
      )}
    </div>
  );
}
