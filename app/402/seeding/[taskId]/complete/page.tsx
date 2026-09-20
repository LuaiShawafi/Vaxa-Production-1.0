import { notFound } from "next/navigation";
import { getSeedingTaskDetail, getTeam402 } from "@/lib/db/queries/seeding";
import { prisma } from "@/lib/db/prisma";
import { CompleteSeedingWizard } from "@/components/seeding/CompleteSeedingWizard";
import { SeedingCompleteSuccess } from "@/components/seeding/SeedingCompleteSuccess";
import {
  bomSnapshotSchema,
  preselectedLotEntrySchema,
} from "@/lib/validation/seeding";
import {
  requiredSeedLabels,
  requiredSeedVarietyIds,
} from "@/lib/domain/seeding/requiredSeedVarieties";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";

type PageProps = { params: Promise<{ taskId: string }> };

export default async function CompleteSeedingPage({ params }: PageProps) {
  const { taskId } = await params;
  const team = await getTeam402();
  if (!team) {
    notFound();
  }

  const detail = await getSeedingTaskDetail(taskId, team.id);
  if (!detail || !detail.task.starterUserId) {
    notFound();
  }

  if (detail.task.status === "COMPLETED") {
    const completedDestination =
      detail.task.batch.officialIdentityLockedAt != null
        ? detail.task.batch.currentDestination
        : detail.task.planItem.destinationIdentity;
    return (
      <main className="max-w-5xl">
        <SeedingCompleteSuccess
          visibleBatchNumber={detail.task.batch.visibleBatchNumber}
          skuCode={detail.task.planItem.sku.code}
          trayQuantity={Number(detail.task.planItem.plannedQuantity)}
          destination={completedDestination}
        />
      </main>
    );
  }

  if (detail.task.status !== "IN_PROGRESS") {
    notFound();
  }

  const bomParsed = bomSnapshotSchema.safeParse(detail.task.batch.bomSnapshot);
  if (!bomParsed.success) {
    notFound();
  }

  const preselected = z
    .array(preselectedLotEntrySchema)
    .safeParse(detail.preselectedLots ?? []);
  if (!preselected.success) {
    notFound();
  }

  const sku = detail.task.planItem.sku;
  const seedVarietyIds = requiredSeedVarietyIds(
    bomParsed.data,
    sku.primarySeedVarietyId,
  );
  const bomSeedNameByVarietyId = new Map(
    bomParsed.data.lines
      .filter((line) => line.kind === "SEED" && line.seedVarietyId)
      .map((line) => [line.seedVarietyId!, line.name] as const),
  );
  const seedLots = await prisma.seedLot.findMany({
    where: {
      seedVarietyId: { in: seedVarietyIds },
      status: "AVAILABLE",
    },
    select: {
      id: true,
      lotNumber: true,
      seedVarietyId: true,
      seedVariety: { select: { name: true } },
    },
    orderBy: [{ seedVariety: { name: "asc" } }, { lotNumber: "asc" }],
  });
  const availableSeedLots = seedLots.map((lot) => ({
    id: lot.id,
    lotNumber: lot.lotNumber,
    seedVarietyName: lot.seedVariety.name,
    seedTypeLabel:
      bomSeedNameByVarietyId.get(lot.seedVarietyId) ?? lot.seedVariety.name,
  }));
  const seedVarietyLabels =
    requiredSeedLabels(bomParsed.data).length > 0
      ? requiredSeedLabels(bomParsed.data)
      : ["required seed variety"];

  const materialIds = [
    ...new Set(
      bomParsed.data.lines
        .filter((l) => l.kind === "MATERIAL" && l.materialId)
        .map((l) => l.materialId!),
    ),
  ];
  const materialLotsRaw = await prisma.materialLot.findMany({
    where: {
      materialId: { in: materialIds },
      status: "AVAILABLE",
    },
    select: { id: true, lotNumber: true, materialId: true },
    orderBy: { lotNumber: "asc" },
  });
  const availableMaterials = materialIds.map((materialId) => {
    const line = bomParsed.data.lines.find(
      (l) => l.kind === "MATERIAL" && l.materialId === materialId,
    );
    return {
      materialId,
      materialName: line?.name ?? "Material",
      lots: materialLotsRaw
        .filter((l) => l.materialId === materialId)
        .map((l) => ({ id: l.id, lotNumber: l.lotNumber })),
    };
  });

  const plannedQty = Number(detail.task.planItem.plannedQuantity);
  const destination =
    detail.task.batch.officialIdentityLockedAt != null
      ? detail.task.batch.currentDestination
      : detail.task.planItem.destinationIdentity;

  return (
    <main className="max-w-5xl">
      <PageHeader
        eyebrow="402 · Cultivation"
        title="Complete Seeding"
        description={`Batch ${detail.task.batch.visibleBatchNumber} · ${detail.task.planItem.sku.code} · ${plannedQty} trays planned`}
        density="production"
        backLink={{
          href: `/402/seeding/${taskId}`,
          label: "← Back to task",
        }}
      />

      <CompleteSeedingWizard
        taskId={taskId}
        teamId={team.id}
        starterUserId={detail.task.starterUserId}
        starterName={detail.task.starterUser?.name ?? null}
        plannedQuantity={plannedQty}
        visibleBatchNumber={detail.task.batch.visibleBatchNumber}
        skuCode={detail.task.planItem.sku.code}
        destination={destination}
        members={detail.teamMembers}
        preselectedLots={preselected.data}
        bomSnapshot={bomParsed.data}
        availableSeedLots={availableSeedLots}
        requiredSeedVarietyLabels={seedVarietyLabels}
        availableMaterials={availableMaterials}
      />
    </main>
  );
}
