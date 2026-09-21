import Link from "next/link";
import {
  activeBatchDetailLinkLabel,
  type ActiveBatchOverviewRow,
} from "@/lib/batches/activeBatchOverviewPresentation";

type ActiveBatchMobileCardProps = {
  row: ActiveBatchOverviewRow;
};

export function ActiveBatchMobileCard({ row }: ActiveBatchMobileCardProps) {
  const timingParts = [
    row.timing.dateLabel,
    row.timing.relativeLabel,
    row.timing.secondaryLabel,
  ].filter(Boolean);

  return (
    <Link
      href={row.href}
      aria-label={activeBatchDetailLinkLabel(
        row.visibleBatchNumber,
        row.skuCode,
      )}
      className="block rounded-card border border-line bg-surface px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
    >
      <article className="min-w-0">
        <p className="text-body font-bold leading-snug wrap-break-word">
          {row.skuCode}
        </p>
        {row.skuDescription ? (
          <p className="mt-0.5 text-body-small leading-snug text-muted wrap-break-word">
            {row.skuDescription}
          </p>
        ) : null}
        <p className="mt-0.5 font-mono text-body-small font-medium leading-snug wrap-break-word">
          {row.visibleBatchNumber}
        </p>
        <p className="mt-1.5 text-body-small leading-snug wrap-break-word">
          <span className="sr-only">Format </span>
          {row.productionFormatLabel}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">Quantity </span>
          {row.quantityLabel}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">Destination </span>
          {row.destination}
        </p>
        <p className="mt-0.5 text-body-small leading-snug wrap-break-word">
          <span className="sr-only">Timing </span>
          {timingParts.join(" · ")}
        </p>
      </article>
    </Link>
  );
}
