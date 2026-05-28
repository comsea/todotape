import { useState } from 'react';
import type { Task } from '../store/types';
import { DoneItem } from '../components/DoneItem';

interface DoneDrawerProps {
  items: Task[];
  scope: string;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function DoneDrawer({ items, scope, onToggle, onDelete }: DoneDrawerProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="done-drawer">
      <button
        type="button"
        className="done-drawer-header"
        onClick={() => setOpen(o => !o)}
      >
        <span>{open ? '▼' : '▶'} ✓ FACE B — TERMINÉES CETTE {scope.toUpperCase()}</span>
        <span className="count">{items.length}</span>
      </button>

      {open && (
        items.length === 0 ? (
          <div className="empty-note">la face B est vierge — coche tes premières tâches !</div>
        ) : (
          <div className="done-list">
            {items.map(t => (
              <DoneItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
