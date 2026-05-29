import { useMemo } from 'react';
import type { AppState, DayKey, DayMeta } from '../store/types';

interface Props {
  state: AppState;
  currentWeekDates: DayMeta[];
  todayKey: DayKey;
}

interface Rank { min: number; label: string; icon: string; color: string; desc: string; }

const RANKS: Rank[] = [
  { min: 90, label: 'LÉGENDE',    icon: '🌟', color: '#ffd700', desc: 'Semaine parfaite — tu es une machine !' },
  { min: 75, label: 'PRODUCTEUR', icon: '🎙', color: '#ff2d8a', desc: 'Excellente semaine, garde ce rythme !' },
  { min: 55, label: 'DJ',         icon: '🎧', color: '#ff7c3a', desc: 'Bonne semaine — le groove est là.' },
  { min: 35, label: 'BEATMAKER',  icon: '🥁', color: '#4a90d9', desc: 'Semaine correcte — quelques ratés mais ça joue.' },
  { min: 15, label: 'STAGIAIRE',  icon: '📼', color: '#8b7355', desc: 'On démarre doucement… les platines chaufferont !' },
  { min: 0,  label: 'EN PAUSE',   icon: '⏸',  color: '#aaa',    desc: "Aucune tâche cochée cette semaine." },
];

function getRank(score: number): Rank {
  return RANKS.find(r => score >= r.min) ?? RANKS[RANKS.length - 1];
}

export function ScoreView({ state, currentWeekDates, todayKey }: Props) {
  const { score, done, total, dayScores } = useMemo(() => {
    const dayScores = currentWeekDates.map(d => {
      const t = state.tasks.filter(x => x.day === d.key && x.week === 'current').length
              + state.done.filter(x => x.day === d.key && x.week === 'current').length;
      const dn = state.done.filter(x => x.day === d.key && x.week === 'current').length;
      return { ...d, total: t, done: dn, ratio: t === 0 ? 0 : dn / t };
    });
    const total = dayScores.reduce((s, d) => s + d.total, 0);
    const done  = dayScores.reduce((s, d) => s + d.done, 0);
    const score = total === 0 ? 0 : Math.round((done / total) * 100);
    return { score, done, total, dayScores };
  }, [state, currentWeekDates]);

  const rank = getRank(score);

  // Streak
  const todayIdx = currentWeekDates.findIndex(d => d.key === todayKey);
  let streak = 0;
  for (let i = todayIdx; i >= 0; i--) {
    if (state.done.some(t => t.day === currentWeekDates[i].key && t.week === 'current')) streak++;
    else break;
  }

  // Progression de la jauge circulaire (SVG)
  const r = 70, circ = 2 * Math.PI * r;
  const progress = circ - (score / 100) * circ;

  return (
    <div className="score-wrap">
      {/* ── Pochette principale ── */}
      <div className="score-cassette cassette-big">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ SCORE DE PRODUCTIVITÉ ★</span>
          <span className="spool" />
        </div>

        <div className="score-body">
          {/* Jauge circulaire */}
          <div className="score-gauge-wrap">
            <svg className="score-gauge" viewBox="0 0 160 160" width="160" height="160">
              {/* piste fond */}
              <circle cx="80" cy="80" r={r} fill="none" stroke="var(--paper-deep)" strokeWidth="14" />
              {/* arc de progression */}
              <circle
                cx="80" cy="80" r={r}
                fill="none"
                stroke={rank.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={progress}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="80" y="74" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="22" fill="var(--ink)">{score}%</text>
              <text x="80" y="96" textAnchor="middle" fontFamily="'VT323', monospace" fontSize="16" fill="var(--ink-soft)">{done}/{total} tâches</text>
            </svg>
          </div>

          {/* Rang */}
          <div className="score-rank" style={{ '--rank-color': rank.color } as React.CSSProperties}>
            <div className="score-rank-icon">{rank.icon}</div>
            <div className="score-rank-label">{rank.label}</div>
            <div className="score-rank-desc">{rank.desc}</div>
          </div>

          {/* Streak */}
          <div className="score-streak">
            <span className="score-streak-val">{streak}</span>
            <span className="score-streak-lbl">🔥 jour{streak !== 1 ? 's' : ''} de streak</span>
          </div>
        </div>

        {/* Mini barres par jour */}
        <div className="score-days">
          {dayScores.map(d => (
            <div key={d.key} className={`score-day ${d.key === todayKey ? 'is-today' : ''}`}>
              <div className="score-day-bar-wrap">
                <div className="score-day-bar-bg" />
                <div
                  className="score-day-bar-fill"
                  style={{ height: `${d.ratio * 100}%`, background: rank.color }}
                />
              </div>
              <span className="score-day-label">{d.short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Échelle des rangs ── */}
      <div className="score-ranks-list">
        <div className="score-ranks-title">ÉCHELLE DES RANGS</div>
        {RANKS.map(r => (
          <div key={r.label} className={`rank-row ${rank.label === r.label ? 'is-current' : ''}`}>
            <span className="rank-icon">{r.icon}</span>
            <span className="rank-name" style={{ color: r.color }}>{r.label}</span>
            <span className="rank-min">≥ {r.min}%</span>
            <span className="rank-desc">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
