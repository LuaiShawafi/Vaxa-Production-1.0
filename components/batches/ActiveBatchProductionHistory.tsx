import { Card } from "@/components/ui/Card";
import { presentActiveBatchHistory } from "@/lib/batches/activeBatchDetailPresentation";
import type { ActiveBatchDetailEvent } from "@/lib/domain/batches/activeBatchDetailReadModel";

export function ActiveBatchProductionHistory({
  events,
}: {
  events: ActiveBatchDetailEvent[];
}) {
  const history = presentActiveBatchHistory(events);

  if (history.length === 0) {
    return <Card className="p-5 text-muted">No production history yet.</Card>;
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <ol>
        {history.map((entry) => (
          <li
            key={entry.id}
            className="border-b border-line px-5 py-3 last:border-0"
          >
            <p className="font-semibold wrap-break-word">{entry.label}</p>
            <p className="mt-0.5 text-caption text-muted wrap-break-word">
              {entry.timestampLabel}
              {entry.userName ? ` · ${entry.userName}` : ""}
            </p>
            {entry.detail ? (
              <p className="mt-1 text-body-small wrap-break-word">
                {entry.detail}
              </p>
            ) : null}
            {entry.secondary ? (
              <p className="mt-0.5 text-caption text-muted wrap-break-word">
                {entry.secondary}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
