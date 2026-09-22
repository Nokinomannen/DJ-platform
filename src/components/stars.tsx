export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!value || count === 0) return <span className="text-xs text-muted">Ny på Gigga</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-accent" aria-hidden>
        ★
      </span>
      <span className="font-semibold">{value.toFixed(1).replace(".", ",")}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-accent" aria-label={`${value} av 5 stjärnor`}>
      {"★".repeat(value)}
      <span className="text-border">{"★".repeat(5 - value)}</span>
    </span>
  );
}
