import type { XPState } from '../store/xp';
import { GRADES, getGrade, getNextGrade } from '../store/xp';

interface Props { xp: XPState; }

export function GradeView({ xp }: Props) {
  const current  = getGrade(xp.total);
  const next     = getNextGrade(xp.total);
  const nextG    = next ?? null;
  const xpInGrade    = next ? xp.total - current.minXP : 0;
  const xpNeededFull = next ? next.minXP - current.minXP : 1;
  const progress     = next ? Math.round((xpInGrade / xpNeededFull) * 100) : 100;
  const xpToNext     = next ? next.minXP - xp.total : 0;

  return (
    <div className="grade-wrap">

      {/* ── Cassette grade actuel ── */}
      <div className="grade-main cassette-big">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ TON GRADE ★</span>
          <span className="spool" />
        </div>

        <div className="grade-current">
          <div className="grade-icon-big">{current.icon}</div>
          <div className="grade-name-big">{current.name.toUpperCase()}</div>
          <div className="grade-xp-total">
            <span className="grade-xp-val">{xp.total}</span>
            <span className="grade-xp-lbl"> XP</span>
          </div>
        </div>

        {/* Barre de progression vers le prochain */}
        {nextG && (
          <div className="grade-progress-wrap">
            <div className="grade-progress-labels">
              <span>{current.name}</span>
              <span>{nextG.name} {nextG.icon}</span>
            </div>
            <div className="grade-progress-bar">
              <div
                className="grade-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grade-progress-info">
              <span className="grade-xp-missing">
                encore <b>{xpToNext} XP</b> pour devenir {nextG.name}
              </span>
              <span className="grade-progress-pct">{progress}%</span>
            </div>
          </div>
        )}
        {!nextG && (
          <div className="grade-maxed">
            ★ GRADE MAXIMUM ATTEINT — TU ES UNE LÉGENDE ★
          </div>
        )}
      </div>

      {/* ── Comment gagner des XP ── */}
      <div className="grade-howto">
        <div className="grade-howto-title">COMMENT GAGNER DES XP</div>
        <div className="grade-howto-list">
          <div className="grade-howto-item">
            <span className="grade-howto-icon">✓</span>
            <span>Tâche priorité 1 cochée</span>
            <span className="grade-howto-xp">+10 XP</span>
          </div>
          <div className="grade-howto-item">
            <span className="grade-howto-icon">✓</span>
            <span>Tâche priorité 2 cochée</span>
            <span className="grade-howto-xp">+25 XP</span>
          </div>
          <div className="grade-howto-item">
            <span className="grade-howto-icon">✓</span>
            <span>Tâche priorité 3 cochée</span>
            <span className="grade-howto-xp">+50 XP</span>
          </div>
          <div className="grade-howto-item">
            <span className="grade-howto-icon">🔥</span>
            <span>Bonus streak journalier</span>
            <span className="grade-howto-xp">+15 XP</span>
          </div>
        </div>
      </div>

      {/* ── Tableau des grades ── */}
      <div className="grade-table">
        <div className="grade-table-title">TOUS LES GRADES</div>
        {GRADES.map((g) => {
          const unlocked = xp.total >= g.minXP;
          const isCurrent = g.name === current.name;
          return (
            <div
              key={g.name}
              className={`grade-row ${isCurrent ? 'is-current' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <span className="grade-row-icon">{unlocked ? g.icon : '🔒'}</span>
              <span className="grade-row-name">{g.name}</span>
              <span className="grade-row-xp">{g.minXP} XP</span>
              {isCurrent && <span className="grade-row-badge">● EN COURS</span>}
            </div>
          );
        })}
      </div>

    </div>
  );
}
