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

      {/* ── Explication ── */}
      <div className="page-explainer">
        <div className="page-explainer-title">📊 C'EST QUOI CE TABLEAU ?</div>
        <p>Le tableau de bord te donne une vue d'ensemble de <b>ta semaine en cours</b>. D'un coup d'œil tu vois quels jours tu as été productif et lesquels sont encore chargés.</p>
        <div className="page-explainer-tips">
          <div className="page-explainer-tip">
            <span>📈</span>
            <span><b>Ratio complété</b> — pourcentage de toutes tes tâches de la semaine déjà cochées. Vise 100% vendredi soir !</span>
          </div>
          <div className="page-explainer-tip">
            <span>🔥</span>
            <span><b>Streak</b> — nombre de jours consécutifs où tu as coché au moins une tâche. Plus c'est long, plus tu gagnes d'XP !</span>
          </div>
          <div className="page-explainer-tip">
            <span>📊</span>
            <span><b>Barres par jour</b> — la barre rose montre les tâches faites, le gris ce qui reste. Un jour entièrement rose = journée parfaite !</span>
          </div>
        </div>
      </div>

      <div className="cassette-big dash-card">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ TABLEAU DE BORD ★</span>
          <span className="spool" />
        </div>

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

        <div className="dash-chart">
          {bars.map((b, i) => (
            <div key={b.key} className={`bar-col ${b.key === todayKey ? 'is-today' : ''}`}>
              <div className="bar-wrap">
                <div className="bar bar-total" style={{ height: `${(b.total / maxTotal) * 100}%` }} />
                <div className="bar bar-done"  style={{ height: `${(b.done / maxTotal) * 100}%` }} />
              </div>
              <span className="bar-label">{DAY_LABELS[i]}</span>
              {b.total > 0 && <span className="bar-count">{b.done}/{b.total}</span>}
            </div>
          ))}
        </div>

        <div className="dash-legend">
          <span><span className="legend-dot done" />Terminées</span>
          <span><span className="legend-dot total" />Restantes</span>
        </div>
      </div>
    </div>
  );
}
