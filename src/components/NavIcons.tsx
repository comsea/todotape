// Icônes SVG custom dans la DA de l'app — trait rose/beige, style cassette rétro

interface IconProps {
  active?: boolean;
  size?: number;
}

const C = (active?: boolean) => active ? '#ff2d8a' : '#8a8075';

// 📼 Mes tapes — une cassette
export function IconTapes({ active, size = 26 }: IconProps) {
  const c = C(active);
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="22" height="16" rx="3" stroke={c} strokeWidth="1.5"/>
      <rect x="7" y="9" width="12" height="8" rx="2" fill="none" stroke={c} strokeWidth="1"/>
      <circle cx="9.5" cy="13" r="2.5" stroke={c} strokeWidth="1"/>
      <circle cx="16.5" cy="13" r="2.5" stroke={c} strokeWidth="1"/>
      <path d="M 12 13 Q 13 15 14 13" fill="none" stroke={c} strokeWidth="1"/>
      <circle cx="4.5" cy="7" r="1" fill={c}/>
      <circle cx="21.5" cy="7" r="1" fill={c}/>
      <circle cx="4.5" cy="19" r="1" fill={c}/>
      <circle cx="21.5" cy="19" r="1" fill={c}/>
    </svg>
  );
}

// 🏅 Grade & XP — étoile avec barre XP
export function IconGrade({ active, size = 26 }: IconProps) {
  const c = C(active);
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="13,3 15.5,9 22,9.5 17,14 18.5,21 13,17.5 7.5,21 9,14 4,9.5 10.5,9" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="5" y="22" width="16" height="3" rx="1.5" fill="none" stroke={c} strokeWidth="1"/>
      {active && <rect x="5" y="22" width="10" height="3" rx="1.5" fill={c}/>}
    </svg>
  );
}

// 📊 Tableau de bord — barres verticales style égaliseur
export function IconDashboard({ active, size = 26 }: IconProps) {
  const c = C(active);
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="14" width="4" height="9" rx="1" stroke={c} strokeWidth="1.5"/>
      <rect x="9" y="9" width="4" height="14" rx="1" stroke={c} strokeWidth="1.5"/>
      <rect x="15" y="5" width="4" height="18" rx="1" stroke={c} strokeWidth="1.5"/>
      <rect x="21" y="11" width="2" height="12" rx="1" stroke={c} strokeWidth="1.5"/>
      <line x1="2" y1="23" x2="24" y2="23" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// 🗃 Archives — pile de cassettes
export function IconArchives({ active, size = 26 }: IconProps) {
  const c = C(active);
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cassette du bas */}
      <rect x="3" y="15" width="20" height="9" rx="2" stroke={c} strokeWidth="1.5" opacity="0.4"/>
      {/* Cassette du milieu */}
      <rect x="3" y="10" width="20" height="9" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/>
      {/* Cassette du haut */}
      <rect x="3" y="5" width="20" height="9" rx="2" stroke={c} strokeWidth="1.5"/>
      <circle cx="9" cy="9.5" r="2" stroke={c} strokeWidth="1"/>
      <circle cx="17" cy="9.5" r="2" stroke={c} strokeWidth="1"/>
      <path d="M 11 9.5 Q 13 11 15 9.5" fill="none" stroke={c} strokeWidth="1"/>
    </svg>
  );
}
