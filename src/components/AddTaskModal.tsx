import { useState, useEffect, useRef } from 'react';
import type { DayKey, DayMeta, WeekKey } from '../store/types';
import { DAY_KEYS } from '../store/types';
import { Bolts } from './Bolts';

interface AddTaskModalProps {
  defaults: { day?: DayKey; week: WeekKey };
  currentWeekDates: DayMeta[];
  nextWeekDates: DayMeta[];
  todayKey: DayKey;
  onSave: (data: { name: string; day: DayKey; week: WeekKey; end: DayKey | null; endWeek: WeekKey | null; prio: 1 | 2 | 3 }) => void;
  onClose: () => void;
}

export function AddTaskModal({ defaults, currentWeekDates, nextWeekDates, todayKey, onSave, onClose }: AddTaskModalProps) {
  const [name, setName]       = useState('');
  const [week, setWeek]       = useState<WeekKey>(defaults.week);
  const [day, setDay]         = useState<DayKey>(defaults.day ?? todayKey);
  const [end, setEnd]         = useState<DayKey | null>(null);
  const [endWeek, setEndWeek] = useState<WeekKey | null>(null);
  const [prio, setPrio]       = useState<1 | 2 | 3>(1);
  const nameRef = useRef<HTMLInputElement>(null);

  const todayIdx = DAY_KEYS.indexOf(todayKey);
  const dayIdx   = DAY_KEYS.indexOf(day);

  const activeDates = week === 'current' ? currentWeekDates : nextWeekDates;

  // Un jour est dans le passé si on est sur la semaine courante et son index < aujourd'hui
  const isDayPast = (d: DayMeta, w: WeekKey) =>
    w === 'current' && DAY_KEYS.indexOf(d.key) < todayIdx;

  // Un jour de fin est invalide si :
  // - il est dans le passé (semaine current)
  // - il est avant le jour de début sur la même semaine
  const isEndDisabled = (d: DayMeta, endWk: WeekKey) => {
    if (isDayPast(d, endWk)) return true;
    if (endWk === week) {
      // même semaine que le début → doit être >= jour de début
      return DAY_KEYS.indexOf(d.key) < dayIdx;
    }
    // S+1 est toujours valide comme fin si le début est en S
    return false;
  };

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleWeekChange = (w: WeekKey) => {
    setWeek(w);
    // Si on revient sur S, s'assurer que le jour sélectionné n'est pas dans le passé
    if (w === 'current' && DAY_KEYS.indexOf(day) < todayIdx) {
      setDay(todayKey);
    }
    // Réinitialise la date de fin si elle n'est plus valide
    if (end !== null && endWeek !== null) {
      if (w === 'next' && endWeek === 'current') {
        setEnd(null); setEndWeek(null);
      }
    }
  };

  const handleDayChange = (d: DayKey) => {
    setDay(d);
    // Si la date de fin est maintenant avant le nouveau début → reset
    if (end !== null && endWeek === week) {
      if (DAY_KEYS.indexOf(end) < DAY_KEYS.indexOf(d)) {
        setEnd(null); setEndWeek(null);
      }
    }
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { nameRef.current?.focus(); return; }
    onSave({ name: name.trim(), day, week, end, endWeek, prio });
  };

  const endOptions: Array<{ dates: DayMeta[]; weekKey: WeekKey; label: string }> = week === 'current'
    ? [
        { dates: currentWeekDates, weekKey: 'current', label: 'Cette semaine' },
        { dates: nextWeekDates,    weekKey: 'next',    label: 'Semaine suivante' },
      ]
    : [
        { dates: nextWeekDates, weekKey: 'next', label: 'Semaine S+1' },
      ];

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
                <button key={n} type="button" className={`prio-btn ${prio === n ? 'on' : ''}`} onClick={() => setPrio(n)}>
                  <Bolts n={n} />
                  <span className="prio-lbl">{(['tranquille', 'normal', 'urgent'] as const)[n - 1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Semaine ── */}
          <div className="field">
            <span className="field-label">SEMAINE</span>
            <div className="day-picker" style={{ gap: 8 }}>
              {(['current', 'next'] as WeekKey[]).map(w => (
                <button
                  key={w}
                  type="button"
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

          {/* ── Jour ── */}
          <div className="field">
            <span className="field-label">JOUR <em>(obligatoire)</em></span>
            <div className="day-picker">
              {activeDates.map(d => {
                const past = isDayPast(d, week);
                return (
                  <button
                    key={d.key}
                    type="button"
                    className={`day-btn ${day === d.key ? 'on' : ''} ${d.isToday ? 'today' : ''} ${past ? 'disabled' : ''}`}
                    onClick={() => !past && handleDayChange(d.key)}
                    disabled={past}
                    title={past ? 'Jour déjà passé' : ''}
                  >
                    <span className="d">{d.short}</span>
                    <span className="dt">{d.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Date de fin ── */}
          <div className="field">
            <span className="field-label">À FINIR AVANT <em>(optionnel)</em></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="day-picker end-picker">
                <button
                  type="button"
                  className={`day-btn none ${end === null ? 'on' : ''}`}
                  onClick={() => { setEnd(null); setEndWeek(null); }}
                >
                  <span className="d">—</span>
                  <span className="dt">aucune</span>
                </button>
              </div>

              {endOptions.map(group => (
                <div key={group.weekKey}>
                  <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 3, fontFamily: 'VT323, monospace', letterSpacing: 1 }}>
                    {group.label.toUpperCase()}
                  </div>
                  <div className="day-picker end-picker">
                    {group.dates.map(d => {
                      const disabled = isEndDisabled(d, group.weekKey);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`day-btn ${end === d.key && endWeek === group.weekKey ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
                          onClick={() => !disabled && (setEnd(d.key), setEndWeek(group.weekKey))}
                          disabled={disabled}
                          title={disabled ? 'Date invalide' : ''}
                        >
                          <span className="d">{d.short}</span>
                          <span className="dt">{d.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
