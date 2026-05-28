import type { Task, DayMeta } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface BigTaskProps {
  task: Task;
  weekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  focused?: boolean;
  tabIndex?: number;
  onFocus?: () => void;
}

export function BigTask({ task, weekDates, onToggle, onDelete, focused, tabIndex, onFocus }: BigTaskProps) {
  const endDate = task.end ? weekDates.find(d => d.key === task.end) : null;
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
      {endDate && <span className="deadline">→ FIN {endDate.short}</span>}
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
