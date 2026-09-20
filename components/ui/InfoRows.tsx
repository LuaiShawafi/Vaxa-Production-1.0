type Row = { label: string; value: string };

export function InfoRows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-caption text-muted">{row.label}</dt>
          <dd className="font-semibold">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
