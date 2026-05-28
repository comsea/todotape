import { useState, useEffect, useRef } from 'react';
import type { DayKey, DayMeta } from '../store/types';
import { Bolts } from './Bolts';

interface AddTaskModalProps {
  defaults: { day?: DayKey };
  weekDates: DayMeta[];
  todayKey: DayKey;
  onSave: (data: { name: string; day: DayKey; end: DayKey | null; prio: 1 | 2 | 3 }) => void;
  onClose: () => void;
}

export function AddTaskModal({ defaults, weekDates, todayKey, onSave, onClose }: AddTaskModalProps) {
  const [name, setName] = useState('');
  const [day, setDay]   = useState<DayKey>(defaults.day ?? todayKey);
  const [end, setEnd]   = useState<DayKey | null>(null);
  const [prio, setPrio] = useState<1 | 2 | 3>(1);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { nameRef.current?.focus(); return; }
    onSave({ name: name.trim(), day, end, prio });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form
        className="modal cassette-big"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ NOUVEAU MORCEAU ★</span>
          <span className="spool" />
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">TITRE</span>
            <input
              ref={nameRef}
              className="sketch-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. appeler le dentiste"
              maxLength={80}
            />
          </label>

          <div className="field">
            <span className="field-label">PRIORITÉ</span>
            <div className="prio-picker">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  className={`prio-btn ${prio === n ? 'on' : ''}`}
                  onClick={() => setPrio(n)}
                >
                  <Bolts n={n} />
                  <span className="prio-lbl">
                    {(['tranquille', 'normal', 'urgent'] as const)[n - 1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">JOUR <em>(obligatoire)</em></span>
            <div className="day-picker">
              {weekDates.map(d => (
                <button
                  key={d.key}
                  type="button"
                  className={`day-btn ${day === d.key ? 'on' : ''} ${d.isToday ? 'today' : ''}`}
                  onClick={() => setDay(d.key)}
                >
                  <span className="d">{d.short}</span>
                  <span className="dt">{d.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">À FINIR AVANT <em>(optionnel)</em></span>
            <div className="day-picker end-picker">
              <button
                type="button"
                className={`day-btn none ${end === null ? 'on' : ''}`}
                onClick={() => setEnd(null)}
              >
                <span className="d">—</span>
                <span className="dt">aucune</span>
              </button>
              {weekDates.map(d => (
                <button
                  key={d.key}
                  type="button"
                  className={`day-btn ${end === d.key ? 'on' : ''}`}
                  onClick={() => setEnd(d.key)}
                >
                  <span className="d">{d.short}</span>
                  <span className="dt">{d.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn-sketch" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-sketch primary">▶ Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
