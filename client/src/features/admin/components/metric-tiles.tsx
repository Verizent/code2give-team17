export type MetricTile = {
  label: string
  value: string
  hint: string
}

/** Plain counts, straight from the database. No rates here — see rate-tile.tsx. */
export function MetricTiles({ tiles }: { tiles: MetricTile[] }) {
  return (
    <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.label}>
          <p className="text-xs font-bold uppercase tracking-wide text-navy/50">{tile.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-navy">{tile.value}</p>
          <p className="mt-1 text-sm text-navy/60">{tile.hint}</p>
        </li>
      ))}
    </ul>
  )
}
