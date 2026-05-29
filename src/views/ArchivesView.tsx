import { useMemo } from 'react';
import type { AppState } from '../store/types';
import { DAY_KEYS, MONTHS_FR } from '../store/types';

interface Props { state: AppState; }

// Génère un faux historique des 8 dernières semaines à partir des tâches done
// (en production on brancherait sur un vrai store d'archives)
function getMondayOfWeek(offsetWeeks: number): Date {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const m1 = monday.getDate(), mo1 = MONTHS_FR[monday.getMonth()];
  const m2 = sunday.getDate(), mo2 = MONTHS_FR[sunday.getMonth()];
  const yr  = sunday.getFullYear();
  return mo1 === mo2
    ? `${m1} – ${m2} ${mo1} ${yr}`
    : `${m1} ${mo1} – ${m2} ${mo2} ${yr}`;
}

export function ArchivesView({ state }: Props) {
  // On simule 8 semaines passées avec des données fictives tirées des tâches done
  const archives = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const offset = -(i + 1); // semaines passées
      const monday = getMondayOfWeek(offset);
      // score pseudo-aléatoire mais stable basé sur la semaine
      const seed = monday.getDate() + monday.getMonth() * 7;
      const total = 5 + (seed % 8);
      const done  = Math.min(total, 2 + (seed % (total - 1)));
      const score = Math.round((done / total) * 100);
      return {
        id: monday.toISOString(),
        label: weekLabel(monday),
        total,
        done,
        score,
        weekNum: Math.ceil((monday.getDate() + 6) / 7),
      };
    });
  }, []);

  const bestScore = Math.max(...archives.map(a => a.score));

  return (
    <div className="archives-wrap">
      <div className="archives-header">
        <span className="archives-title">📼 DISCOGRAPHIE</span>
        <span className="archives-sub">{archives.length} semaines archivées</span>
      </div>

      <div className="archives-grid">
        {archives.map((week, i) => (
          <div key={week.id} className={`archive-card ${week.score === bestScore ? 'is-best' : ''}`}>
            {week.score === bestScore && <div className="archive-best-badge">★ MEILLEURE SEMAINE</div>}
            <div className="archive-cassette">
              <div className="archive-spool-row">
                <span className="archive-spool" />
                <span className="archive-spool" />
              </div>
              <div className="archive-score-circle">
                <span className="archive-score-val">{week.score}%</span>
              </div>
            </div>
            <div className="archive-info">
              <div className="archive-label">{week.label}</div>
              <div className="archive-stats">
                <span className="archive-done">{week.done} ✓</span>
                <span className="archive-sep">/</span>
                <span className="archive-total">{week.total} tâches</span>
              </div>
              <div className="archive-bar">
                <div className="archive-bar-fill" style={{ width: `${week.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
