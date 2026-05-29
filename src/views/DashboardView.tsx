import { useMemo } from 'react';
import type { AppState, DayKey, DayMeta } from '../store/types';

interface Props {
  state: AppState;
  currentWeekDates: DayMeta[];
  todayKey: DayKey;
}

const DAY_LABELS = ['LUN','MAR','MER','JEU','VEN','SAM','DIM'];

export function DashboardView({ state, currentWeekDates, todayKey }: Props) {
  const bars = useMemo(() => {
    return currentWeekDates.map(d => {
      const total = state.tasks.filter(t => t.day === d.key && t.week === 'current').length
                  + state.done.filter(t => t.day === d.key && t.week === 'current').length;
      const done  = state.done.filter(t => t.day === d.key && t.week === 'current').length;
      return { ...d, total, done, ratio: total === 0 ? 0 : done / total };
    });
  }, [state, currentWeekDates]);

  const totalWeek = bars.reduce((s, b) => s + b.total, 0);
  const doneWeek  = bars.reduce((s, b) => s + b.done, 0);
  const ratioWeek = totalWeek === 0 ? 0 : Math.round((doneWeek / totalWeek) * 100);

  // Streak : jours consécutifs avec au moins 1 tâche faite (depuis aujourd'hui vers le passé)
  const todayIdx = currentWeekDates.findIndex(d => d.key === todayKey);
  let streak = 0;
  for (let i = todayIdx; i >= 0; i--) {
    const d = currentWeekDates[i];
    const hasDone = state.done.some(t => t.day === d.key && t.week === 'current');
    if (hasDone) streak++;
    else break;
  }

  const maxTotal = Math.max(...bars.map(b => b.total), 1);

  return (
    <div className="dash-wrap">
      <div className="cassette-big dash-card">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ TABLEAU DE BORD ★</span>
          <span className="spool" />
        </div>

        {/* ── KPIs ── */}
        <div className="dash-kpis">
          <div className="kpi">
            <span className="kpi-val">{ratioWeek}%</span>
            <span className="kpi-lbl">complété cette semaine</span>
          </div>
          <div className="kpi">
            <span className="kpi-val">{doneWeek}<span className="kpi-of">/{totalWeek}</span></span>
            <span className="kpi-lbl">tâches terminées</span>
          </div>
          <div className="kpi">
            <span className="kpi-val streak">{streak}🔥</span>
            <span className="kpi-lbl">jours de streak</span>
          </div>
        </div>

        {/* ── Graphique barres ── */}
        <div className="dash-chart">
          {bars.map((b, i) => (
            <div key={b.key} className={`bar-col ${b.key === todayKey ? 'is-today' : ''}`}>
              <div className="bar-wrap">
                {/* barre total */}
                <div
                  className="bar bar-total"
                  style={{ height: `${(b.total / maxTotal) * 100}%` }}
                />
                {/* barre done par-dessus */}
                <div
                  className="bar bar-done"
                  style={{ height: `${(b.done / maxTotal) * 100}%` }}
                />
              </div>
              <span className="bar-label">{DAY_LABELS[i]}</span>
              {b.total > 0 && (
                <span className="bar-count">{b.done}/{b.total}</span>
              )}
            </div>
          ))}
        </div>

        {/* ── Légende ── */}
        <div className="dash-legend">
          <span><span className="legend-dot done" />Terminées</span>
          <span><span className="legend-dot total" />Restantes</span>
        </div>
      </div>
    </div>
  );
}
