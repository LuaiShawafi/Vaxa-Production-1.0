import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeedingTaskDetail, getTeam402 } from "@/lib/db/queries/seeding";
import { Card } from "@/components/ui/Card";
import { StartSeedingPanel } from "@/components/seeding/StartSeedingPanel";
import { SeedingTaskSummary } from "@/components/seeding/SeedingTaskSummary";
import { bomSnapshotSchema } from "@/lib/validation/seeding";
import { PageHeader } from "@/components/layout/PageHeader";

type PageProps = { params: Promise<{ taskId: string }> };

export default async function SeedingTaskPage({ params }: PageProps) {
  const { taskId } = await params;
  const team = await getTeam402();
  if (!team) {
    notFound();
  }

  const detail = await getSeedingTaskDetail(taskId, team.id);
  if (!detail) {
    notFound();
  }

  const { task, bomReady, hasBom, teamMembers } = detail;
  const inProgress = task.status === "IN_PROGRESS";
  const completed = task.status === "COMPLETED";
  const canStart = task.status === "OPEN" && hasBom && bomReady;
  const blockedOpen = task.status === "OPEN" && (!hasBom || !bomReady);

  const destination =
    task.batch.officialIdentityLockedAt != null
      ? task.batch.currentDestination
      : task.planItem.destinationIdentity;

  const plannedQuantityLabel = task.planItem.plannedQuantity.toString();
  const quantityUom = task.planItem.quantityUom;

  const bomParsed = bomSnapshotSchema.safeParse(task.batch.bomSnapshot);
  const showFrozenBom = bomParsed.success && (inProgress || completed);

  return (
    <main className="max-w-5xl">
      <PageHeader
        eyebrow="402 · Cultivation"
        title="Start Seeding"
        density="production"
        description={`Batch ${task.batch.visibleBatchNumber} · ${task.planItem.sku.code}`}
        backLink={{ href: "/402", label: "← Back to 402 Today" }}
      />

      <SeedingTaskSummary
        batchNumber={task.batch.visibleBatchNumber}
        skuCode={task.planItem.sku.code}
        plannedQuantityLabel={plannedQuantityLabel}
        quantityUom={quantityUom}
        destination={destination}
        taskStatus={task.status}
        hasBom={hasBom}
        bomReady={bomReady}
        starterName={task.starterUser?.name ?? null}
        startedAtLabel={
          task.startedAt ? task.startedAt.toLocaleString() : null
        }
        showCompleteAction={inProgress}
        completeHref={
          inProgress ? `/402/seeding/${taskId}/complete` : undefined
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        {canStart ? (
          <StartSeedingPanel
            taskId={taskId}
            teamId={team.id}
            members={teamMembers}
          />
        ) : null}

        {canStart ? (
          <Card className="flex flex-col p-5 sm:p-6">
            <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
              Before you begin
            </p>
            <h2 className="mt-1 text-h3 font-bold">Quick check</h2>
            <ul className="mt-4 space-y-3 text-body-small text-muted">
              <li className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green"
                  aria-hidden="true"
                />
                <span>
                  Confirm the batch, SKU, tray count, and destination above.
                </span>
              </li>
              <li className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green"
                  aria-hidden="true"
                />
                <span>Select your name on the shared 402 device.</span>
              </li>
              <li className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green"
                  aria-hidden="true"
                />
                <span>
                  Press Start Seeding, then complete after the physical work.
                </span>
              </li>
            </ul>
            <p className="mt-auto pt-5 text-caption text-muted">
              Detailed lot allocation and quantity confirmation happen at
              Complete — not at Start.
            </p>
          </Card>
        ) : null}

        {blockedOpen ? (
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <p className="text-body font-semibold text-text">
              Seeding cannot start yet
            </p>
            <p className="mt-1 text-body-small text-muted">
              Resolve the BOM readiness issue above, then return to select your
              name and start.
            </p>
            <Link
              href="/402"
              className="mt-4 inline-block text-body-small font-semibold text-green underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              Return to 402 Today
            </Link>
          </Card>
        ) : null}

        {showFrozenBom ? (
          <details className="group rounded-card border border-line bg-surface shadow-card lg:col-span-2">
            <summary className="cursor-pointer list-none px-5 py-4 sm:px-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
                    Details
                  </p>
                  <p className="mt-1 text-h3 font-bold text-text">
                    Frozen BOM snapshot
                  </p>
                  <p className="mt-1 text-body-small text-muted">
                    Material lines locked when seeding started.
                  </p>
                </div>
                <span
                  className="shrink-0 text-body-small font-bold text-green"
                  aria-hidden="true"
                >
                  <span className="group-open:hidden">Show</span>
                  <span className="hidden group-open:inline">Hide</span>
                </span>
              </div>
            </summary>
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <ul className="space-y-2 text-body-small text-muted">
                {bomParsed.success
                  ? bomParsed.data.lines.map((line) => (
                      <li
                        key={line.lineKey}
                        className="flex gap-2 border-b border-line/70 pb-2 last:border-0 last:pb-0"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-semibold text-text">
                            {line.name}
                          </span>
                          {` · ${line.qtyPerUnit} ${line.uom} per production unit`}
                        </span>
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}
