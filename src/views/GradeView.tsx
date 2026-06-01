import type { XPState } from '../store/xp';
import { GRADES, getGrade, getNextGrade } from '../store/xp';

interface Props { xp: XPState; }

export function GradeView({ xp }: Props) {
  const current  = getGrade(xp.total);
  const next     = getNextGrade(xp.total);
  const xpInGrade    = next ? xp.total - current.minXP : 0;
  const xpNeededFull = next ? next.minXP - current.minXP : 1;
  const progress     = next ? Math.round((xpInGrade / xpNeededFull) * 100) : 100;
  const xpToNext     = next ? next.minXP - xp.total : 0;

  return (
    <div className="grade-wrap">

      {/* ── Grade actuel ── */}
      <div className="grade-main cassette-big">
        <div className="cassette-big-label">
          <span className="spool" />
          <span>★ TON GRADE ★</span>
          <span className="spool" />
        </div>

        <div className="grade-current">
          <div className="grade-icon-big">{current.icon}</div>
          {/* Même typo Boogaloo que le badge header, aussi gros que le titre */}
          <div className="grade-name-big">{current.name}</div>
          <div className="grade-xp-total">
            <span className="grade-xp-val">{xp.total}</span>
            <span className="grade-xp-lbl"> XP accumulés</span>
          </div>
        </div>

        {next && (
          <div className="grade-progress-wrap">
            <div className="grade-progress-labels">
              <span>{current.name}</span>
              <span>{next.icon} {next.name}</span>
            </div>
            <div className="grade-progress-bar">
              <div className="grade-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="grade-progress-info">
              <span className="grade-xp-missing">encore <b>{xpToNext} XP</b> pour {next.name}</span>
              <span className="grade-progress-pct">{progress}%</span>
            </div>
          </div>
        )}
        {!next && <div className="grade-maxed">★ DIEU DU GROOVE — GRADE ULTIME ATTEINT ★</div>}
      </div>

      {/* ── Comment gagner des XP ── */}
      <div className="grade-howto">
        <div className="grade-howto-title">💡 COMMENT GAGNER DES XP</div>

        <div className="grade-howto-section">
          <div className="grade-howto-section-title">En cochant des tâches</div>
          <div className="grade-howto-item">
            <div className="grade-howto-left">
              <span className="grade-howto-prio prio-1">●</span>
              <div>
                <div className="grade-howto-name">Priorité basse</div>
                <div className="grade-howto-desc">Petites actions du quotidien</div>
              </div>
            </div>
            <span className="grade-howto-xp">+10 XP</span>
          </div>
          <div className="grade-howto-item">
            <div className="grade-howto-left">
              <span className="grade-howto-prio prio-2">●</span>
              <div>
                <div className="grade-howto-name">Priorité normale</div>
                <div className="grade-howto-desc">Tâches importantes de ta semaine</div>
              </div>
            </div>
            <span className="grade-howto-xp">+25 XP</span>
          </div>
          <div className="grade-howto-item">
            <div className="grade-howto-left">
              <span className="grade-howto-prio prio-3">●</span>
              <div>
                <div className="grade-howto-name">Priorité urgente</div>
                <div className="grade-howto-desc">Tâches critiques, à ne pas rater</div>
              </div>
            </div>
            <span className="grade-howto-xp">+50 XP</span>
          </div>
        </div>

        <div className="grade-howto-section">
          <div className="grade-howto-section-title">Bonus quotidien</div>
          <div className="grade-howto-item">
            <div className="grade-howto-left">
              <span className="grade-howto-prio">🔥</span>
              <div>
                <div className="grade-howto-name">Streak du jour</div>
                <div className="grade-howto-desc">+15 XP à la première tâche cochée de la journée. Reviens chaque jour pour maintenir ton streak !</div>
              </div>
            </div>
            <span className="grade-howto-xp">+15 XP</span>
          </div>
        </div>

        <div className="grade-howto-tip">
          💬 <b>Conseil :</b> commence par une petite tâche priorité 1 pour déclencher le bonus streak et te mettre en mouvement. Le reste suivra naturellement !
        </div>
      </div>

      {/* ── Tableau des 20 grades ── */}
      <div className="grade-table">
        <div className="grade-table-title">🏆 LES 20 GRADES</div>
        {GRADES.map((g) => {
          const unlocked  = xp.total >= g.minXP;
          const isCurrent = g.name === current.name;
          return (
            <div key={g.name} className={`grade-row ${isCurrent ? 'is-current' : ''} ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="grade-row-icon">{unlocked ? g.icon : '🔒'}</span>
              <div className="grade-row-info">
                <span className="grade-row-name">{g.name}</span>
                <span className="grade-row-xp">{g.minXP === 0 ? 'départ' : `à partir de ${g.minXP.toLocaleString('fr-FR')} XP`}</span>
              </div>
              {isCurrent && <span className="grade-row-badge">● EN COURS</span>}
              {unlocked && !isCurrent && <span className="grade-row-check">✓</span>}
            </div>
          );
        })}
      </div>

    </div>
  );
}
