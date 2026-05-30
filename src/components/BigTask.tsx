import type { Task, DayMeta } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface BigTaskProps {
  task: Task;
  currentWeekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  focused?: boolean;
  tabIndex?: number;
  onFocus?: () => void;
}

export function BigTask({ task, currentWeekDates, nextWeekDates, onToggle, onDelete, focused, tabIndex, onFocus }: BigTaskProps) {
  const endDates = task.endWeek === 'next' ? nextWeekDates : currentWeekDates;
  const endDate = task.end ? endDates.find(d => d.key === task.end) : null;
  const endLabel = endDate
    ? task.endWeek === 'next'
      ? `→ FIN ${endDate.short} S+1`
      : `→ FIN ${endDate.short}`
    : null;

  return (
    <div
      className={`big-task ${task.done ? 'done' : ''} ${focused ? 'focused' : ''}`}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === ' ') { e.preventDefault(); onToggle(task); }
      }}
    >
      <Checkbox checked={!!task.done} onChange={() => onToggle(task)} size="lg" />
      <span className="name">{task.name}</span>
      {endLabel && <span className="deadline">{endLabel}</span>}
      {task.recurrence === 'weekly' && <span className="recur-badge">🔁</span>}
      <Bolts n={task.prio} />
      <button
        type="button"
        className="del-btn"
        onClick={() => onDelete(task)}
        aria-label="supprimer"
      >
        ×
      </button>
    </div>
  );
}
