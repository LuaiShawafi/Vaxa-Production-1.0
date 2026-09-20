import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeedingTaskDetail, getTeam402 } from "@/lib/db/queries/seeding";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { InfoRows } from "@/components/ui/InfoRows";
import { StartSeedingPanel } from "@/components/seeding/StartSeedingPanel";
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

  const bomParsed = bomSnapshotSchema.safeParse(task.batch.bomSnapshot);

  return (
    <main className="max-w-3xl">
      <PageHeader
        eyebrow="402 · Seeding"
        title={`${task.planItem.sku.code} · ${task.batch.visibleBatchNumber}`}
        density="production"
        backLink={{ href: "/402", label: "← 402 Today" }}
      />

      <Card className="mt-6 p-5">
        <InfoRows
          rows={[
            { label: "Planned", value: `${task.planItem.plannedQuantity} trays` },
            {
              label: "Destination",
              value:
                task.batch.officialIdentityLockedAt != null
                  ? task.batch.currentDestination
                  : task.planItem.destinationIdentity,
            },
            { label: "BOM", value: hasBom ? (bomReady ? "Ready" : "Not ready") : "Missing" },
            { label: "Task", value: task.status },
          ]}
        />
        {!hasBom || !bomReady ? (
          <p className="mt-3 text-red text-body-small">
            Production is blocked until a ready PROD BOM exists.
          </p>
        ) : null}
      </Card>

      {inProgress || completed ? (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Pill tone="blue">{completed ? "Completed" : "In progress"}</Pill>
              {task.starterUser ? (
                <p className="mt-2 text-body-small text-muted">
                  Started by {task.starterUser.name}
                  {task.startedAt
                    ? ` · ${task.startedAt.toLocaleString()}`
                    : ""}
                </p>
              ) : null}
            </div>
            {inProgress ? (
              <Link href={`/402/seeding/${taskId}/complete`}>
                <Button variant="primary" density="production">Complete</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      {canStart ? (
        <StartSeedingPanel
          taskId={taskId}
          teamId={team.id}
          members={teamMembers}
        />
      ) : null}

      {bomParsed.success && inProgress ? (
        <Card className="mt-6 p-5 text-body-small text-muted">
          <p className="font-semibold text-text">Frozen BOM snapshot</p>
          <ul className="mt-2 list-disc pl-5">
            {bomParsed.data.lines.map((line) => (
              <li key={line.lineKey}>
                {line.name} ({line.qtyPerUnit} {line.uom} per production unit)
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </main>
  );
}
