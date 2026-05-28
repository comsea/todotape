interface BoltsProps {
  n: 1 | 2 | 3;
}

export function Bolts({ n }: BoltsProps) {
  return (
    <span className="bolts" aria-label={`priorité ${n} sur 3`}>
      {'⚡'.repeat(n)}
      <span className="dim">{'·'.repeat(3 - n)}</span>
    </span>
  );
}
