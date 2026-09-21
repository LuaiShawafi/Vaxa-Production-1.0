type Row = { label: string; value: string };

export function InfoRows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-caption text-muted wrap-break-word">{row.label}</dt>
          <dd className="font-semibold wrap-break-word">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
