import { notFound } from "next/navigation";
import { PlanDayAddButton } from "@/components/planning/PlanDayAddButton";
import { PlanItemEditController } from "@/components/planning/PlanItemEditController";
import { PlanItemRowActions } from "@/components/planning/PlanItemRowActions";
import { WeeklyPlanDetailHeader } from "@/components/planning/WeeklyPlanDetailHeader";
import {
  getWeeklyPlanDetail,
  listActiveSkus,
  listActiveTeams,
} from "@/lib/db/queries/planning";
import { Pill } from "@/components/ui/Pill";
import { formatDateInput, isoWeekPlanningDaySections } from "@/lib/date";
import { planItemUiState } from "@/lib/planning/planItemUiState";
import { ProductionTaskStatus, WeeklyPlanStatus } from "@prisma/client";

/** Sticky on small viewports so Edit/Delete stay visible while the table scrolls. */
const planItemActionsCellClass =
  "bg-surface p-3 max-lg:sticky max-lg:right-0 max-lg:z-[1] max-lg:w-[1%] max-lg:min-w-[11.5rem] max-lg:whitespace-nowrap max-lg:border-l max-lg:border-line max-lg:shadow-[-10px_0_12px_-6px_rgba(24,32,27,0.14)]";

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
        <div className="space-y-2">
            {weekdaySections.map((section) => {
              const dayItems = itemsByDate.get(section.dateInput) ?? [];
              const isEmpty = dayItems.length === 0;

              return (
                <section
                  key={section.dateInput}
                  className={isEmpty ? undefined : "pb-4"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <h2 className="text-h3 font-bold">
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
                      <p className="mt-1 text-muted text-body-small">
                        No items planned.
                      </p>
                    )
                  ) : (
                    <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
                      <table className="w-full text-table">
                        <thead>
                          <tr className="border-b border-line text-left text-caption uppercase text-muted">
                            <th className="p-3">State</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Team</th>
                            <th className="p-3">Destination</th>
                            <th className="p-3">Batch #</th>
                            <th className={planItemActionsCellClass}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayItems.map((item) => {
                            const taskStatus = item.productionTasks[0]
                              ?.status as ProductionTaskStatus | undefined;
                            const uiState = planItemUiState(
                              plan.status,
                              taskStatus,
                            );
                            const stateLabel =
                              uiState === "draft"
                                ? "Draft"
                                : uiState === "open"
                                  ? "Open"
                                  : "Started / locked";

                            return (
                              <tr
                                key={item.id}
                                className="border-b border-line align-middle last:border-0"
                              >
                                <td className="p-3">
                                  <Pill
                                    tone={
                                      uiState === "locked"
                                        ? "amber"
                                        : uiState === "open"
                                          ? "green"
                                          : "blue"
                                    }
                                  >
                                    {stateLabel}
                                  </Pill>
                                </td>
                                <td className="p-3 font-semibold">
                                  {item.sku.code}
                                </td>
                                <td className="p-3">
                                  {item.plannedQuantity.toString()}{" "}
                                  {item.quantityUom}
                                </td>
                                <td className="p-3">{item.assignedTeam.name}</td>
                                <td className="p-3">
                                  {item.destinationIdentity}
                                </td>
                                <td className="p-3 font-mono text-body-small">
                                  {item.batch?.visibleBatchNumber ?? "—"}
                                </td>
                                <td className={planItemActionsCellClass}>
                                  <PlanItemRowActions
                                    planId={plan.id}
                                    uiState={uiState}
                                    devDeletionEnabled={devDeletionEnabled}
                                    batchId={item.batch?.id ?? null}
                                    planItemId={item.id}
                                    subject={
                                      uiState === "draft" || uiState === "open"
                                        ? {
                                            kind: "edit",
                                            planItemId: item.id,
                                            skuId: item.sku.id,
                                            skuCode: item.sku.code,
                                            plannedDateInput: formatDateInput(
                                              item.plannedDate,
                                            ),
                                            weekdayName: section.weekdayName,
                                            weekdayLabel: `${section.weekdayName} ${section.dayLabel}`,
                                            plannedQuantity:
                                              item.plannedQuantity.toString(),
                                            assignedTeamId:
                                              item.assignedTeam.id,
                                            assignedTeamName:
                                              item.assignedTeam.name,
                                            destinationIdentity:
                                              item.destinationIdentity,
                                            lockSku: uiState === "open",
                                            uiState,
                                            stateLabel,
                                            visibleBatchNumber:
                                              item.batch?.visibleBatchNumber ??
                                              null,
                                          }
                                        : null
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </PlanItemEditController>
    </main>
  );
}
