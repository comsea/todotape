interface BoltsProps {
  n: 1 | 2 | 3;
}

export function Bolts({ n }: BoltsProps) {
  return (
    <span
      className="bolts"
      aria-label={`priorité ${n} sur 3`}
      style={{ color: '#1c1b18' }}
    >
      {'⚡'.repeat(n)}
      <span className="dim" style={{ color: '#1c1b1855' }}>{'·'.repeat(3 - n)}</span>
    </span>
  );
}

