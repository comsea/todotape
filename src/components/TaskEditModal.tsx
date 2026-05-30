import { useState, useEffect, useRef } from 'react';
import type { Task, DayKey, DayMeta, WeekKey } from '../store/types';
import { DAY_KEYS } from '../store/types';
import { Bolts } from './Bolts';

interface TaskEditModalProps {
  task: Task;
  currentWeekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  todayKey: DayKey;
  onSave: (updated: Task) => void;
  onDelete: (task: Task) => void;
  onClose: () => void;
}

export function TaskEditModal({ task, currentWeekDates, nextWeekDates, todayKey, onSave, onDelete, onClose }: TaskEditModalProps) {
  const [day, setDay]     = useState<DayKey>(task.day);
  const [week, setWeek]   = useState<WeekKey>(task.week);
  const [notes, setNotes] = useState(task.notes ?? '');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const todayIdx = DAY_KEYS.indexOf(todayKey);
  const activeDates = week === 'current' ? currentWeekDates : nextWeekDates;

  const isDayPast = (d: DayMeta, w: WeekKey) =>
    w === 'current' && DAY_KEYS.indexOf(d.key) < todayIdx;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleWeekChange = (w: WeekKey) => {
    setWeek(w);
    if (w === 'current' && DAY_KEYS.indexOf(day) < todayIdx) setDay(todayKey);
  };

  const handleSave = () => {
    onSave({ ...task, day, week, notes: notes.trim() || undefined });
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(`Supprimer "${task.name}" ?`)) return;
    onDelete(task);
    onClose();
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal cassette-big task-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ MODIFIER LA TÂCHE ★</span>
          <span className="spool" />
        </div>

        <div className="modal-body">

          {/* Nom + méta */}
          <div className="task-edit-header">
            <div className="task-edit-name">{task.name}</div>
            <div className="task-edit-meta">
              <Bolts n={task.prio} />
              {task.recurrence === 'weekly' && <span className="recur-badge">🔁 récurrente</span>}
            </div>
          </div>

          {/* Changer la semaine */}
          <div className="field">
            <span className="field-label">SEMAINE</span>
            <div className="day-picker" style={{ gap: 8 }}>
              {(['current', 'next'] as WeekKey[]).map(w => (
                <button key={w} type="button"
                  className={`day-btn ${week === w ? 'on' : ''}`}
                  style={{ minWidth: 90 }}
                  onClick={() => handleWeekChange(w)}
                >
                  <span className="d" style={{ fontSize: 11 }}>{w === 'current' ? 'S' : 'S+1'}</span>
                  <span className="dt" style={{ fontSize: 10 }}>{w === 'current' ? 'cette sem.' : 'sem. proch.'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Changer le jour */}
          <div className="field">
            <span className="field-label">DÉPLACER AU JOUR</span>
            <div className="day-picker">
              {activeDates.map(d => {
                const past = isDayPast(d, week);
                return (
                  <button key={d.key} type="button"
                    className={`day-btn ${day === d.key ? 'on' : ''} ${d.isToday ? 'today' : ''} ${past ? 'disabled' : ''}`}
                    onClick={() => !past && setDay(d.key)}
                    disabled={past}
                  >
                    <span className="d">{d.short}</span>
                    <span className="dt">{d.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="field">
            <span className="field-label">NOTES <em>(optionnel)</em></span>
            <textarea
              ref={notesRef}
              className="sketch-input task-edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ajoute des détails, un lien, une idée…"
              rows={4}
            />
          </div>

        </div>

        <div className="modal-foot task-edit-foot">
          <button type="button" className="btn-sketch danger" onClick={handleDelete}>
            🗑 Supprimer
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-sketch" onClick={onClose}>Annuler</button>
            <button type="button" className="btn-sketch primary" onClick={handleSave}>▶ Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
