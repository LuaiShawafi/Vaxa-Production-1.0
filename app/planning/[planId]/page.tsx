import { notFound } from "next/navigation";
import { PlanDayAddButton } from "@/components/planning/PlanDayAddButton";
import { PlanItemEditController } from "@/components/planning/PlanItemEditController";
import { PlanItemMobileCard } from "@/components/planning/PlanItemMobileCard";
import { PlanItemRowActions } from "@/components/planning/PlanItemRowActions";
import { WeeklyPlanDetailHeader } from "@/components/planning/WeeklyPlanDetailHeader";
import {
  getWeeklyPlanDetail,
  listActiveSkus,
  listActiveTeams,
} from "@/lib/db/queries/planning";
import { Pill } from "@/components/ui/Pill";
import { formatDateInput, isoWeekPlanningDaySections } from "@/lib/date";
import {
  buildPlanItemWeekDetailPresentation,
  formatPlanItemProductionUnits,
} from "@/lib/planning/planItemWeekDetailPresentation";
import { WeeklyPlanStatus } from "@prisma/client";

/** Comfortable row-action targets without changing PlanItemRowActions. */
const planItemRowActionsSurfaceClass =
  "[&_button]:min-h-11 [&_button]:px-3.5 [&_button]:text-body-small";

const planWeekTableHeadCellClass =
  "px-3.5 py-3 text-left text-eyebrow font-bold uppercase tracking-[0.08em] text-muted";
const planWeekTableCellClass = "px-3.5 py-3.5 align-middle text-body-small";

type PageProps = { params: Promise<{ planId: string }> };

export default async function PlanningDetailPage({ params }: PageProps) {
  const { planId } = await params;
  const plan = await getWeeklyPlanDetail(planId);
  if (!plan) {
    notFound();
  }

  const [skus, teams] = await Promise.all([
    listActiveSkus(),
    listActiveTeams(),
  ]);

  const isDraft = plan.status === WeeklyPlanStatus.DRAFT;
  const devDeletionEnabled =
    process.env.ENABLE_DEV_DATA_DELETION === "true";

  const weekdaySections = isoWeekPlanningDaySections(plan.week);

  const itemsByDate = new Map<string, typeof plan.planItems>();
  for (const item of plan.planItems) {
    const key = formatDateInput(item.plannedDate);
    const list = itemsByDate.get(key) ?? [];
    list.push(item);
    itemsByDate.set(key, list);
  }

  return (
    <main className="mx-auto max-w-5xl">
      <WeeklyPlanDetailHeader
        planId={plan.id}
        week={plan.week}
        status={plan.status}
        itemCount={plan.planItems.length}
        devDeletionEnabled={devDeletionEnabled}
      />

      <PlanItemEditController planId={plan.id} skus={skus} teams={teams}>
        <div className="space-y-8">
            {weekdaySections.map((section) => {
              const dayItems = itemsByDate.get(section.dateInput) ?? [];
              const isEmpty = dayItems.length === 0;

              return (
                <section
                  key={section.dateInput}
                  className={
                    isEmpty
                      ? "pb-1"
                      : "border-b border-line pb-8 last:border-b-0 last:pb-2"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h2 className="text-h3 font-bold tracking-tight">
                      {section.weekdayName} — {section.dayLabel}
                    </h2>
                    {isDraft ? (
                      <PlanDayAddButton
                        dateInput={section.dateInput}
                        weekdayName={section.weekdayName}
                        dayLabel={section.dayLabel}
                      />
                    ) : null}
                  </div>

                  {isEmpty ? (
                    isDraft ? null : (
                      <p className="mt-2 text-muted text-body-small">
                        No items planned.
                      </p>
                    )
                  ) : (
                    <>
                      <div className="mt-4 hidden overflow-x-auto rounded-card border border-line bg-surface plan-week:block">
                        <table className="w-full text-body-small">
                          <thead>
                            <tr className="border-b border-line bg-surface-2/35 text-left">
                              <th className={planWeekTableHeadCellClass}>State</th>
                              <th className={planWeekTableHeadCellClass}>SKU</th>
                              <th className={planWeekTableHeadCellClass}>Qty</th>
                              <th className={planWeekTableHeadCellClass}>Units</th>
                              <th className={planWeekTableHeadCellClass}>
                                Destination
                              </th>
                              <th className={planWeekTableHeadCellClass}>
                                Batch #
                              </th>
                              <th className={planWeekTableHeadCellClass}>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayItems.map((item) => {
                              const { uiState, stateLabel, subject } =
                                buildPlanItemWeekDetailPresentation({
                                  item,
                                  planStatus: plan.status,
                                  weekdayName: section.weekdayName,
                                  dayLabel: section.dayLabel,
                                });

                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-line align-middle last:border-0"
                                >
                                  <td className={planWeekTableCellClass}>
                                    <Pill
                                      tone={
                                        uiState === "locked"
                                          ? "amber"
                                          : uiState === "open"
                                            ? "green"
                                            : "blue"
                                      }
                                      className="px-2.5 py-1.5 text-eyebrow"
                                    >
                                      {stateLabel}
                                    </Pill>
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} font-semibold`}
                                  >
                                    {item.sku.code}
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} tabular-nums`}
                                  >
                                    {item.plannedQuantity.toString()}{" "}
                                    {item.quantityUom}
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} tabular-nums font-medium`}
                                  >
                                    {formatPlanItemProductionUnits(
                                      item.plannedQuantity,
                                      item.sku.productionFormat,
                                    )}
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} tabular-nums`}
                                  >
                                    {item.destinationIdentity}
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} font-mono`}
                                  >
                                    {item.batch?.visibleBatchNumber ?? "—"}
                                  </td>
                                  <td
                                    className={`${planWeekTableCellClass} ${planItemRowActionsSurfaceClass}`}
                                  >
                                    <PlanItemRowActions
                                      planId={plan.id}
                                      uiState={uiState}
                                      devDeletionEnabled={devDeletionEnabled}
                                      batchId={item.batch?.id ?? null}
                                      planItemId={item.id}
                                      subject={subject}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex flex-col gap-2.5 plan-week:hidden">
                        {dayItems.map((item) => {
                          const { uiState, stateLabel, subject } =
                            buildPlanItemWeekDetailPresentation({
                              item,
                              planStatus: plan.status,
                              weekdayName: section.weekdayName,
                              dayLabel: section.dayLabel,
                            });

                          return (
                            <PlanItemMobileCard
                              key={item.id}
                              planId={plan.id}
                              devDeletionEnabled={devDeletionEnabled}
                              planItemId={item.id}
                              batchId={item.batch?.id ?? null}
                              uiState={uiState}
                              stateLabel={stateLabel}
                              skuCode={item.sku.code}
                              productionUnitsDisplay={formatPlanItemProductionUnits(
                                item.plannedQuantity,
                                item.sku.productionFormat,
                              )}
                              plannedQuantity={item.plannedQuantity.toString()}
                              quantityUom={item.quantityUom}
                              teamName={item.assignedTeam.name}
                              destinationIdentity={item.destinationIdentity}
                              visibleBatchNumber={
                                item.batch?.visibleBatchNumber ?? null
                              }
                              subject={subject}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </section>
              );
            })}
        </div>
      </PlanItemEditController>
    </main>
  );
}
