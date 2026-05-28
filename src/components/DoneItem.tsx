import type { Task } from '../store/types';
import { Checkbox } from './Checkbox';
import { Bolts } from './Bolts';

interface DoneItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function DoneItem({ task, onToggle, onDelete }: DoneItemProps) {
  return (
    <div className="done-item">
      <Checkbox checked={true} onChange={() => onToggle(task)} />
      <span style={{ flex: 1 }}>{task.name}</span>
      <Bolts n={task.prio} />
      <span style={{ fontFamily: 'VT323, monospace', fontSize: 14, width: 36, textAlign: 'right' }}>
        {task.day.toUpperCase()}
      </span>
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
