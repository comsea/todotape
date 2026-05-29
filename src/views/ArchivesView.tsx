import { useEffect, useState } from 'react';
import { loadArchives } from '../store/persistence';
import type { WeekArchive } from '../store/persistence';

// Couleur selon score
function scoreColor(score: number): string {
  if (score >= 90) return '#ff2d8a';
  if (score >= 70) return '#4a90d9';
  if (score >= 35) return '#ff7c3a';
  return '#8a8075';
}

// Calcul du remplissage des bobines (bobine gauche = done, droite = reste)
function spoolRadius(ratio: number, min = 10, max = 22): number {
  return min + ratio * (max - min);
}

interface CassetteProps {
  archive: WeekArchive;
  isBest: boolean;
}

function Cassette({ archive, isBest }: CassetteProps) {
  const color = scoreColor(archive.score);
  const doneRatio  = archive.total === 0 ? 0 : archive.done / archive.total;
  const todoRatio  = 1 - doneRatio;
  const leftR  = spoolRadius(doneRatio);   // bobine gauche = faites (grossit)
  const rightR = spoolRadius(todoRatio);   // bobine droite = restantes (se vide)

  // Calcul du ruban entre les bobines
  const spoolY = 52;
  const leftX  = 62;
  const rightX = 138;

  return (
    <div className={`arc-card ${isBest ? 'is-best' : ''}`}>
      {isBest && <div className="arc-best-badge">★ BEST</div>}

      {/* Cassette SVG réaliste */}
      <svg className="arc-svg" viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
        {/* Boîtier */}
        <rect x="4" y="4" width="192" height="122" rx="8" ry="8"
          fill="#2a2724" stroke="#1a1614" strokeWidth="2" />
        {/* Reflet haut */}
        <rect x="4" y="4" width="192" height="20" rx="8" ry="8"
          fill="rgba(255,255,255,0.04)" />

        {/* Fenêtre transparente centrale */}
        <rect x="30" y="24" width="140" height="72" rx="5" ry="5"
          fill="#1a1917" stroke="#111" strokeWidth="1.5" />
        {/* Reflet fenêtre */}
        <rect x="30" y="24" width="140" height="10" rx="5" ry="5"
          fill="rgba(255,255,255,0.06)" />

        {/* Etiquette couleur en bas */}
        <rect x="4" y="100" width="192" height="26" rx="0" ry="0"
          fill={color} opacity="0.15" />
        <rect x="4" y="100" width="192" height="2"
          fill={color} opacity="0.6" />

        {/* Bobine gauche (tâches faites) */}
        <circle cx={leftX} cy={spoolY} r={leftR + 4}
          fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx={leftX} cy={spoolY} r={leftR}
          fill="#222" stroke={color} strokeWidth="1.5" />
        <circle cx={leftX} cy={spoolY} r={leftR * 0.38}
          fill="#1a1917" stroke="#444" strokeWidth="1" />
        {/* Rayons bobine gauche */}
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = leftX + (leftR * 0.42) * Math.cos(rad);
          const y1 = spoolY + (leftR * 0.42) * Math.sin(rad);
          const x2 = leftX + (leftR * 0.85) * Math.cos(rad);
          const y2 = spoolY + (leftR * 0.85) * Math.sin(rad);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#444" strokeWidth="1" />;
        })}

        {/* Bobine droite (tâches restantes) */}
        <circle cx={rightX} cy={spoolY} r={rightR + 4}
          fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx={rightX} cy={spoolY} r={rightR}
          fill="#222" stroke="#555" strokeWidth="1.5" />
        <circle cx={rightX} cy={spoolY} r={rightR * 0.38}
          fill="#1a1917" stroke="#444" strokeWidth="1" />
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = rightX + (rightR * 0.42) * Math.cos(rad);
          const y1 = spoolY + (rightR * 0.42) * Math.sin(rad);
          const x2 = rightX + (rightR * 0.85) * Math.cos(rad);
          const y2 = spoolY + (rightR * 0.85) * Math.sin(rad);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#444" strokeWidth="1" />;
        })}

        {/* Ruban entre les bobines */}
        <path
          d={`M ${leftX + leftR} ${spoolY} Q ${100} ${spoolY + 18} ${rightX - rightR} ${spoolY}`}
          fill="none" stroke="#8B7355" strokeWidth="2.5" opacity="0.7"
        />

        {/* Score au centre */}
        <text x="100" y={spoolY + 5} textAnchor="middle"
          fontFamily="'Press Start 2P', monospace" fontSize="11"
          fill={color} style={{ textShadow: `0 0 8px ${color}` }}>
          {archive.score}%
        </text>

        {/* Trous de fixation */}
        <circle cx="16" cy="16" r="5" fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx="184" cy="16" r="5" fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx="16" cy="114" r="5" fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx="184" cy="114" r="5" fill="#111" stroke="#333" strokeWidth="1" />

        {/* Décrochures basses (profil cassette) */}
        <rect x="70" y="100" width="60" height="8" rx="2" fill="#1a1917" />
        <rect x="85" y="108" width="30" height="6" rx="1" fill="#111" />
      </svg>

      {/* Infos sous la cassette */}
      <div className="arc-info">
        <div className="arc-label" style={{ color }}>{archive.label}</div>
        <div className="arc-stats">
          <span className="arc-done">{archive.done}✓</span>
          <span className="arc-sep"> / </span>
          <span className="arc-total">{archive.total} tâches</span>
        </div>
      </div>
    </div>
  );
}

export function ArchivesView(_: { state: unknown }) {
  const [archives, setArchives] = useState<WeekArchive[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadArchives().then(a => {
      // Trier du plus récent au plus ancien
      const sorted = [...a].sort((x, y) => y.mondayISO.localeCompare(x.mondayISO));
      setArchives(sorted);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="arc-empty">Chargement…</div>;

  if (archives.length === 0) {
    return (
      <div className="arc-empty-state">
        <div className="arc-empty-cassette">📼</div>
        <div className="arc-empty-title">AUCUNE ARCHIVE</div>
        <div className="arc-empty-sub">
          Tes semaines terminées apparaîtront ici automatiquement.
          <br />La première cassette sera créée à la fin de cette semaine.
        </div>
      </div>
    );
  }

  // Grouper par mois + année
  const byMonth = new Map<string, WeekArchive[]>();
  for (const a of archives) {
    const key = `${a.year}-${String(a.month).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(a);
  }

  const MONTHS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const bestScore = Math.max(...archives.map(a => a.score));

  return (
    <div className="arc-wrap">
      <div className="arc-header">
        <span className="arc-title">📼 DISCOGRAPHIE</span>
        <span className="arc-count">{archives.length} cassette{archives.length > 1 ? 's' : ''}</span>
      </div>

      {Array.from(byMonth.entries()).map(([key, weeks]) => {
        const [year, month] = key.split('-');
        return (
          <div key={key} className="arc-month">
            <div className="arc-month-title">
              <span className="arc-month-name">{MONTHS_LONG[parseInt(month)]}</span>
              <span className="arc-month-year">{year}</span>
            </div>
            <div className="arc-grid">
              {weeks.map(w => (
                <Cassette key={w.weekId} archive={w} isBest={w.score === bestScore && w.score > 0} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
