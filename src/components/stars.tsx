export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!value || count === 0) return <span className="text-xs text-muted">New on Gigga</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-accent" aria-hidden>
        ★
      </span>
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-accent" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(value)}
      <span className="text-border">{"★".repeat(5 - value)}</span>
    </span>
  );
}
