import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ActiveBatchMobileCard } from "@/components/batches/ActiveBatchMobileCard";
import {
  activeBatchDetailLinkLabel,
  type ActiveBatchOverviewRow,
} from "@/lib/batches/activeBatchOverviewPresentation";

const tableHeadCellClass =
  "px-3 py-2.5 text-left text-caption font-bold uppercase tracking-[0.06em] text-muted first:pl-4 last:pr-4";
const tableCellClass =
  "px-3 py-2.5 align-top text-table first:pl-4 last:pr-4";

type ActiveBatchSectionProps = {
  title: string;
  lead: string;
  emptyMessage: string;
  rows: ActiveBatchOverviewRow[];
};

export function ActiveBatchSection({
  title,
  lead,
  emptyMessage,
  rows,
}: ActiveBatchSectionProps) {
  return (
    <section>
      <SectionHeader title={title} lead={lead} />

      {rows.length === 0 ? (
        <Card className="px-4 py-3 text-body-small text-muted">
          {emptyMessage}
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden min-[700px]:block">
            <table className="w-full table-fixed text-table">
              <caption className="sr-only">{title}</caption>
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[8%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[26%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line bg-surface-2/35">
                  <th scope="col" className={tableHeadCellClass}>
                    Batch / SKU
                  </th>
                  <th scope="col" className={tableHeadCellClass}>
                    Format
                  </th>
                  <th scope="col" className={tableHeadCellClass}>
                    Quantity
                  </th>
                  <th scope="col" className={tableHeadCellClass}>
                    Destination
                  </th>
                  <th scope="col" className={tableHeadCellClass}>
                    Timing
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className={`${tableCellClass} min-w-0`}>
                      <p className="font-bold leading-snug wrap-break-word">
                        {row.skuCode}
                      </p>
                      {row.skuDescription ? (
                        <p className="mt-0.5 text-caption text-muted wrap-break-word">
                          {row.skuDescription}
                        </p>
                      ) : null}
                      <p className="mt-1 font-mono text-body-small font-medium wrap-break-word">
                        <Link
                          href={row.href}
                          aria-label={activeBatchDetailLinkLabel(
                            row.visibleBatchNumber,
                            row.skuCode,
                          )}
                          className="text-green underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
                        >
                          {row.visibleBatchNumber}
                        </Link>
                      </p>
                    </td>
                    <td className={tableCellClass}>
                      {row.productionFormatLabel}
                    </td>
                    <td
                      className={`${tableCellClass} tabular-nums wrap-break-word`}
                    >
                      {row.quantityLabel}
                    </td>
                    <td
                      className={`${tableCellClass} tabular-nums wrap-break-word`}
                    >
                      {row.destination}
                    </td>
                    <td
                      className={`${tableCellClass} min-w-0`}
                      aria-label={row.timing.accessibleLabel}
                    >
                      <p className="font-medium leading-snug">
                        {row.timing.dateLabel}
                      </p>
                      {row.timing.relativeLabel ? (
                        <p className="mt-0.5 text-caption text-muted">
                          {row.timing.relativeLabel}
                        </p>
                      ) : null}
                      {row.timing.secondaryLabel ? (
                        <p className="mt-0.5 text-caption text-muted">
                          {row.timing.secondaryLabel}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="flex flex-col gap-2 min-[700px]:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <ActiveBatchMobileCard row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
