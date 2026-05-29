import type { Task, DayMeta } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface MiniTaskProps {
  task: Task;
  weekDates: DayMeta[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSelect?: (task: Task) => void;
  isSelected?: boolean;
}

export function MiniTask({ task, weekDates, onToggle, onDelete, onSelect, isSelected }: MiniTaskProps) {
  const endDate = task.end ? weekDates.find(d => d.key === task.end) : null;
  return (
    <div
      className="mini-task"
      data-prio={task.prio}
      style={isSelected ? { outline: '2px solid var(--accent)', borderRadius: '4px', background: 'var(--accent-soft)' } : {}}
    >
      <div className="mini-task-row">
        <Checkbox checked={false} onChange={() => onToggle(task)} />
        <span
          className="mini-task-name"
          onClick={e => { e.stopPropagation(); onSelect?.(task); }}
          style={{ cursor: 'grab', flex: 1 }}
        >
          {task.name}
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(task); }}
          aria-label="supprimer"
          style={{
            background: '#1c1b18',
            color: '#ece2c9',
            border: 'none',
            borderRadius: '3px',
            fontWeight: 'bold',
            fontSize: '14px',
            lineHeight: '1',
            padding: '1px 5px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
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
