import type { Task, DayMeta } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface MiniTaskProps {
  task: Task;
  weekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function MiniTask({ task, weekDates, onToggle, onDelete }: MiniTaskProps) {
  const endDate = task.end ? weekDates.find(d => d.key === task.end) : null;
  return (
    <div className="mini-task" data-prio={task.prio}>
      <div className="mini-task-row">
        <Checkbox checked={false} onChange={() => onToggle(task)} />
        <span className="mini-task-name">{task.name}</span>
        <button
          type="button"
          className="del-btn"
          onClick={() => onDelete(task)}
          aria-label="supprimer"
        >
          ×
        </button>
      </div>
      <div className="mini-task-meta">
        <Bolts n={task.prio} />
        {endDate && <span className="deadline">→ {endDate.short}</span>}
      </div>
    </div>
  );
}
