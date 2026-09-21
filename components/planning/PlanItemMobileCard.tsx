import { PlanItemRowActions } from "@/components/planning/PlanItemRowActions";
import type { PlanItemEditSubject } from "@/components/planning/PlanItemEditDrawer";
import { Pill } from "@/components/ui/Pill";
import { planItemRowShowsVisibleActions } from "@/lib/planning/planItemWeekDetailPresentation";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

const planItemRowActionsSurfaceClass =
  "[&_button]:min-h-11 [&_button]:px-3.5 [&_button]:text-body-small";

type PlanItemMobileCardProps = {
  planId: string;
  devDeletionEnabled: boolean;
  planItemId: string;
  batchId: string | null;
  uiState: PlanItemUiState;
  stateLabel: string;
  skuCode: string;
  productionUnitsDisplay: string;
  plannedQuantity: string;
  quantityUom: string;
  teamName: string;
  destinationIdentity: string;
  visibleBatchNumber: string | null;
  subject: PlanItemEditSubject | null;
};

export function PlanItemMobileCard({
  planId,
  devDeletionEnabled,
  planItemId,
  batchId,
  uiState,
  stateLabel,
  skuCode,
  productionUnitsDisplay,
  plannedQuantity,
  quantityUom,
  teamName,
  destinationIdentity,
  visibleBatchNumber,
  subject,
}: PlanItemMobileCardProps) {
  const showActions = planItemRowShowsVisibleActions(
    uiState,
    devDeletionEnabled,
  );

  const pillTone =
    uiState === "locked" ? "amber" : uiState === "open" ? "green" : "blue";

  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <Pill tone={pillTone} className="px-2.5 py-1.5 text-eyebrow">
        {stateLabel}
      </Pill>
      <p className="mt-2 text-body font-bold leading-snug">{skuCode}</p>
      <p className="mt-1.5 text-body-small font-semibold tabular-nums">
        <span>{productionUnitsDisplay} units</span>
        <span className="font-medium text-muted">
          {" "}
          · {plannedQuantity} {quantityUom}
        </span>
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-body-small">
        <div>
          <dt className="text-caption font-semibold uppercase tracking-[0.06em] text-muted">
            Team
          </dt>
          <dd className="mt-0.5 font-medium">{teamName}</dd>
        </div>
        <div>
          <dt className="text-caption font-semibold uppercase tracking-[0.06em] text-muted">
            Destination
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {destinationIdentity}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-caption font-semibold uppercase tracking-[0.06em] text-muted">
            Batch #
          </dt>
          <dd className="mt-0.5 font-mono text-body-small">
            {visibleBatchNumber ?? "—"}
          </dd>
        </div>
      </dl>

      {showActions ? (
        <div
          className={`mt-4 border-t border-line pt-3 ${planItemRowActionsSurfaceClass}`}
        >
          <PlanItemRowActions
            planId={planId}
            uiState={uiState}
            devDeletionEnabled={devDeletionEnabled}
            batchId={batchId}
            planItemId={planItemId}
            subject={subject}
          />
        </div>
      ) : null}
    </article>
  );
}
