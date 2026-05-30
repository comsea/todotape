import type { Task, DayMeta } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface MiniTaskProps {
  task: Task;
  currentWeekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export function MiniTask({ task, currentWeekDates, nextWeekDates, onToggle, onDelete, onEdit }: MiniTaskProps) {
  const endDates = task.endWeek === 'next' ? nextWeekDates : currentWeekDates;
  const endDate  = task.end ? endDates.find(d => d.key === task.end) : null;
  const endLabel = endDate
    ? task.endWeek === 'next' ? `→ ${endDate.short} S+1` : `→ ${endDate.short}`
    : null;

  return (
    <div className="mini-task" data-prio={task.prio}>
      <div className="mini-task-row">
        <Checkbox checked={false} onChange={() => onToggle(task)} />
        <span
          className="mini-task-name"
          onClick={e => { e.stopPropagation(); onEdit(task); }}
          title="Cliquer pour modifier"
        >
          {task.name}
          {task.notes && <span className="mini-task-has-notes" title={task.notes}>📝</span>}
        </span>
      </div>
      <div className="mini-task-meta">
        <Bolts n={task.prio} />
        {endLabel && <span className="deadline">{endLabel}</span>}
        {task.recurrence === 'weekly' && <span className="recur-badge">🔁</span>}
      </div>
    </div>
  );
}
