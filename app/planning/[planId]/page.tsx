import { notFound } from "next/navigation";
import { PublishPlanButton } from "@/components/planning/PublishPlanButton";
import { PlanItemRowActions } from "@/components/planning/PlanItemRowActions";
import { DevDeleteWeeklyPlanButton } from "@/components/planning/DevDeleteWeeklyPlanButton";
import { ArchivePlanButton } from "@/components/planning/ArchivePlanButton";
import { DeleteEmptyDraftPlanButton } from "@/components/planning/DeleteEmptyDraftPlanButton";
import {
  getWeeklyPlanDetail,
  listActiveSkus,
  listActiveTeams,
} from "@/lib/db/queries/planning";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PlanItemForm } from "@/components/planning/PlanItemForm";
import { formatDateInput, isoWeekPlanningDaySections } from "@/lib/date";
import { planItemUiState } from "@/lib/planning/planItemUiState";
import { ProductionTaskStatus, WeeklyPlanStatus } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";

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
  const isPublished = plan.status === WeeklyPlanStatus.PUBLISHED;
  const isArchived = plan.status === WeeklyPlanStatus.ARCHIVED;
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
      <PageHeader
        eyebrow="Planning"
        title={`Week ${plan.week}`}
        backLink={{ href: "/planning", label: "← Weekly plans" }}
        status={
          <div className="flex flex-wrap items-center gap-2">
            <Pill
              tone={
                isDraft ? "blue" : isArchived ? "amber" : "green"
              }
            >
              {plan.status}
            </Pill>
            {devDeletionEnabled ? (
              <DevDeleteWeeklyPlanButton planId={plan.id} />
            ) : null}
          </div>
        }
      />

      {isDraft && plan.planItems.length === 0 ? (
        <div className="mt-4">
          <DeleteEmptyDraftPlanButton planId={plan.id} />
        </div>
      ) : null}

      {isPublished ? (
        <div className="mt-4">
          <ArchivePlanButton planId={plan.id} />
        </div>
      ) : null}

      {isDraft ? (
        <div className="mt-6">
          <PublishPlanButton planId={plan.id} itemCount={plan.planItems.length} />
        </div>
      ) : null}

      <SectionHeader
        title="Weekly plan"
        lead={
          isArchived
            ? "Archived — read-only history"
            : isDraft
              ? "Add items by day, then publish"
              : "OPEN items remain editable until Start"
        }
      />

      <div className="mt-6 space-y-8">
        {weekdaySections.map((section) => {
          const dayItems = itemsByDate.get(section.dateInput) ?? [];

          return (
            <section key={section.dateInput}>
              <h2 className="text-h3 font-bold">
                {section.weekdayName} — {section.dayLabel}
              </h2>

              {isDraft ? (
                <Card className="mt-3 p-5">
                  <SectionHeader title={`Add to ${section.weekdayName}`} />
                  <PlanItemForm
                    planId={plan.id}
                    skus={skus}
                    teams={teams}
                    defaultPlannedDate={section.dateInput}
                  />
                </Card>
              ) : null}

              {dayItems.length === 0 ? (
                <p className="mt-2 text-muted text-body-small">No items planned.</p>
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
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayItems.map((item) => {
                        const taskStatus = item.productionTasks[0]?.status as
                          | ProductionTaskStatus
                          | undefined;
                        const uiState = planItemUiState(plan.status, taskStatus);
                        const stateLabel =
                          uiState === "draft"
                            ? "Draft"
                            : uiState === "open"
                              ? "Open"
                              : "Started / locked";

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-line align-top last:border-0"
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
                            <td className="p-3 font-semibold">{item.sku.code}</td>
                            <td className="p-3">
                              {item.plannedQuantity.toString()} {item.quantityUom}
                            </td>
                            <td className="p-3">{item.assignedTeam.name}</td>
                            <td className="p-3">{item.destinationIdentity}</td>
                            <td className="p-3 font-mono text-body-small">
                              {item.batch?.visibleBatchNumber ?? "—"}
                            </td>
                            <td className="p-3 min-w-[200px]">
                              <PlanItemRowActions
                                planId={plan.id}
                                uiState={uiState}
                                devDeletionEnabled={devDeletionEnabled}
                                batchId={item.batch?.id ?? null}
                                item={{
                                  id: item.id,
                                  skuId: item.sku.id,
                                  plannedDate: item.plannedDate,
                                  plannedQuantity: item.plannedQuantity.toString(),
                                  assignedTeamId: item.assignedTeam.id,
                                  destinationIdentity: item.destinationIdentity,
                                }}
                                skus={skus}
                                teams={teams}
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
    </main>
  );
}
