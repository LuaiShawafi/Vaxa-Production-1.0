"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeSeedingAction } from "@/lib/actions/seeding";
import { PRODUCTION_UOM } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SeedingSuccessConfirmation } from "@/components/seeding/SeedingSuccessConfirmation";
import { CompleteSeedingStepper } from "@/components/seeding/CompleteSeedingStepper";
import {
  LOT_CHANGE_REASONS,
  SEEDING_DEVIATION_REASONS,
} from "@/lib/validation/reasons";
import type { BomSnapshot, PreselectedLotEntry } from "@/lib/validation/seeding";
import { quantitiesEqual, sumAllocationQuantities } from "@/lib/validation/seeding";

type Member = { id: string; name: string };

type SeedAlloc = {
  seedLotId: string;
  lotNumber: string;
  seedVarietyName: string;
  seedTypeLabel: string;
  quantity: number;
  changeFromPreselected: boolean;
  changeReason?: string;
  notes?: string;
};

export type AvailableSeedLot = {
  id: string;
  lotNumber: string;
  seedVarietyName: string;
  /** Human-readable seed type from frozen BOM (preferred for workers). */
  seedTypeLabel: string;
};

function formatSeedLotOption(lot: AvailableSeedLot) {
  return `${lot.seedTypeLabel} · Lot ${lot.lotNumber}`;
}

type MaterialAlloc = {
  materialLotId: string;
  materialId: string;
  materialName: string;
  lotNumber: string;
  quantity: number;
  changeFromPreselected: boolean;
  changeReason?: string;
  notes?: string;
};

export type AvailableMaterialLots = {
  materialId: string;
  materialName: string;
  lots: { id: string; lotNumber: string }[];
};

const DEVIATION_REASON_LABELS: Record<(typeof SEEDING_DEVIATION_REASONS)[number], string> =
  {
    seed_shortage: "Seed shortage",
    material_shortage: "Material shortage",
    equipment_problem: "Equipment problem",
    change_in_plans: "Change in plans",
    other: "Other",
  };

const LOT_CHANGE_REASON_LABELS: Record<(typeof LOT_CHANGE_REASONS)[number], string> =
  {
    lot_empty: "Lot empty / insufficient quantity",
    lot_unavailable: "Lot unavailable",
    material_quality_issue: "Material quality issue",
    test: "Test",
    change_in_production_plan: "Change in production plan",
    other: "Other",
  };

const selectClassName =
  "w-full min-h-12 rounded-md border border-line bg-surface px-3 py-2 text-body-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green";

const qtyInputClassName =
  "min-h-12 w-[7.5rem] rounded-md border border-line bg-surface px-3 py-2 text-h2 font-extrabold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green";

function buildInitialMaterialAllocations(
  bomSnapshot: BomSnapshot,
  preselectedMaterials: PreselectedLotEntry[],
  availableMaterials: AvailableMaterialLots[],
  plannedQuantity: number,
): MaterialAlloc[] {
  const lines = bomSnapshot.lines.filter(
    (l) => l.kind === "MATERIAL" && l.materialId,
  );
  return lines.map((line) => {
    const materialId = line.materialId!;
    const pre = preselectedMaterials.find((p) => p.materialId === materialId);
    const lots =
      availableMaterials.find((m) => m.materialId === materialId)?.lots ?? [];
    const defaultLotId = pre?.materialLotId ?? lots[0]?.id ?? "";
    const lotNumber =
      pre?.lotNumber ??
      lots.find((l) => l.id === defaultLotId)?.lotNumber ??
      "";
    const preId = pre?.materialLotId;
    return {
      materialId,
      materialName: line.name,
      materialLotId: defaultLotId,
      lotNumber,
      quantity: plannedQuantity,
      changeFromPreselected: Boolean(
        defaultLotId && preId && defaultLotId !== preId,
      ),
    };
  });
}

export function CompleteSeedingWizard({
  taskId,
  teamId,
  starterUserId,
  starterName = null,
  plannedQuantity,
  visibleBatchNumber,
  skuCode,
  destination,
  members,
  preselectedLots,
  bomSnapshot,
  availableSeedLots,
  requiredSeedVarietyLabels = [],
  availableMaterials = [],
}: {
  taskId: string;
  teamId: string;
  starterUserId: string;
  starterName?: string | null;
  plannedQuantity: number;
  visibleBatchNumber: string;
  skuCode: string;
  destination: string;
  members: Member[];
  preselectedLots: PreselectedLotEntry[];
  bomSnapshot: BomSnapshot;
  availableSeedLots: AvailableSeedLot[];
  requiredSeedVarietyLabels?: string[];
  availableMaterials?: AvailableMaterialLots[];
}) {
  const router = useRouter();
  const returnToToday = useCallback(() => {
    router.replace("/402");
    router.refresh();
  }, [router]);
  const [step, setStep] = useState<"complete" | "review">("complete");
  const [actualQty, setActualQty] = useState(plannedQuantity);
  const [participants, setParticipants] = useState<string[]>([starterUserId]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const preselectedSeed = preselectedLots.find((p) => p.lotType === "SEED");
  const preselectedMaterials = preselectedLots.filter(
    (p) => p.lotType === "MATERIAL",
  );

  const [seedAllocations, setSeedAllocations] = useState<SeedAlloc[]>(() => {
    const defaultLot =
      preselectedSeed?.seedLotId ??
      availableSeedLots[0]?.id ??
      "";
    const lotNumber =
      preselectedSeed?.lotNumber ??
      availableSeedLots.find((l) => l.id === defaultLot)?.lotNumber ??
      "";
    const seedVarietyName =
      availableSeedLots.find((l) => l.id === defaultLot)?.seedVarietyName ??
      requiredSeedVarietyLabels[0] ??
      "";
    const seedTypeLabel =
      availableSeedLots.find((l) => l.id === defaultLot)?.seedTypeLabel ??
      requiredSeedVarietyLabels[0] ??
      seedVarietyName;
    return defaultLot
      ? [
          {
            seedLotId: defaultLot,
            lotNumber,
            seedVarietyName,
            seedTypeLabel,
            quantity: plannedQuantity,
            changeFromPreselected: false,
          },
        ]
      : [];
  });

  const [materialAllocations, setMaterialAllocations] = useState<
    MaterialAlloc[]
  >(() =>
    buildInitialMaterialAllocations(
      bomSnapshot,
      preselectedMaterials,
      availableMaterials,
      plannedQuantity,
    ),
  );

  function lotsForMaterial(materialId: string) {
    return (
      availableMaterials.find((m) => m.materialId === materialId)?.lots ?? []
    );
  }

  function updateMaterialLotId(index: number, materialLotId: string) {
    const row = materialAllocations[index];
    if (!row) {
      return;
    }
    const lot = lotsForMaterial(row.materialId).find((l) => l.id === materialLotId);
    if (!lot) {
      return;
    }
    const pre = preselectedMaterials.find(
      (p) => p.materialId === row.materialId,
    );
    const changed = materialLotId !== pre?.materialLotId;
    setMaterialAllocations((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              materialLotId,
              lotNumber: lot.lotNumber,
              changeFromPreselected: changed,
              changeReason: changed ? r.changeReason : undefined,
            }
          : r,
      ),
    );
  }

  const needsDeviation = !quantitiesEqual(actualQty, plannedQuantity);
  const [deviationReason, setDeviationReason] = useState<string>("");
  const [deviationExplanation, setDeviationExplanation] = useState("");

  const seedSum = sumAllocationQuantities(seedAllocations);
  const seedOk = quantitiesEqual(seedSum, actualQty);
  const materialSumOk = materialAllocations.every((m) =>
    quantitiesEqual(m.quantity, actualQty),
  );

  function applyActualQty(v: number) {
    setError(null);
    setActualQty(v);
    setSeedAllocations((prev) =>
      prev.length === 1
        ? [{ ...prev[0]!, quantity: v }]
        : prev,
    );
    setMaterialAllocations((prev) =>
      prev.map((m) => ({ ...m, quantity: v })),
    );
  }

  function addSeedLotRow() {
    const used = new Set(seedAllocations.map((s) => s.seedLotId));
    const next = availableSeedLots.find((l) => !used.has(l.id));
    if (!next) {
      return;
    }
    const preId = preselectedSeed?.seedLotId;
    setSeedAllocations((prev) => [
      ...prev,
      {
        seedLotId: next.id,
        lotNumber: next.lotNumber,
        seedVarietyName: next.seedVarietyName,
        seedTypeLabel: next.seedTypeLabel,
        quantity: Math.max(0, actualQty - sumAllocationQuantities(prev)),
        changeFromPreselected: next.id !== preId,
        changeReason: next.id !== preId ? undefined : undefined,
      },
    ]);
  }

  function updateSeedLotId(index: number, seedLotId: string) {
    const lot = availableSeedLots.find((l) => l.id === seedLotId);
    if (!lot) {
      return;
    }
    const preId = preselectedSeed?.seedLotId;
    const changed = seedLotId !== preId;
    setSeedAllocations((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              seedLotId,
              lotNumber: lot.lotNumber,
              seedVarietyName: lot.seedVarietyName,
              seedTypeLabel: lot.seedTypeLabel,
              changeFromPreselected: changed,
              changeReason: changed ? row.changeReason : undefined,
            }
          : row,
      ),
    );
  }

  function toggleParticipant(id: string) {
    if (id === starterUserId) {
      return;
    }
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function buildPayload() {
    return {
      productionTaskId: taskId,
      teamId,
      actualQuantity: actualQty,
      participantUserIds: participants,
      seedLotAllocations: seedAllocations.map((s) => ({
        seedLotId: s.seedLotId,
        quantity: s.quantity,
        quantityUom: PRODUCTION_UOM,
        changeFromPreselected: s.changeFromPreselected,
        changeReason: s.changeReason,
        notes: s.notes,
      })),
      materialLotAllocations: materialAllocations.map((m) => ({
        materialLotId: m.materialLotId,
        materialId: m.materialId,
        quantity: m.quantity,
        quantityUom: PRODUCTION_UOM,
        changeFromPreselected: m.changeFromPreselected,
        changeReason: m.changeReason,
        notes: m.notes,
      })),
      deviationReason: needsDeviation ? deviationReason : undefined,
      deviationExplanation: needsDeviation ? deviationExplanation : undefined,
    };
  }

  const seedLotsValid = seedAllocations.every(
    (s) =>
      s.quantity > 0 &&
      (!s.changeFromPreselected ||
        (s.changeReason &&
          (s.changeReason !== "other" || Boolean(s.notes?.trim())))),
  );

  const materialLotsValid = materialAllocations.every(
    (m) =>
      Boolean(m.materialLotId) &&
      m.quantity > 0 &&
      (!m.changeFromPreselected ||
        (m.changeReason &&
          (m.changeReason !== "other" || Boolean(m.notes?.trim())))),
  );

  const reviewValid =
    seedOk &&
    materialSumOk &&
    seedLotsValid &&
    materialLotsValid &&
    (!needsDeviation || Boolean(deviationReason)) &&
    (!needsDeviation ||
      deviationReason !== "other" ||
      Boolean(deviationExplanation.trim()));

  const participantNames = members
    .filter((m) => participants.includes(m.id))
    .map((m) => m.name);

  const trayDiff = actualQty - plannedQuantity;
  const seedDiff = actualQty - seedSum;
  const noSeedLots = availableSeedLots.length === 0;
  const missingMaterialLots = materialAllocations.filter(
    (m) => lotsForMaterial(m.materialId).length === 0 || !m.materialLotId,
  );

  const completionSuccessOverlay = (
    <SeedingSuccessConfirmation
      show={showSuccess}
      variant="completed"
      visibleBatchNumber={visibleBatchNumber}
      skuCode={skuCode}
      trayQuantity={actualQty}
      destination={destination}
      onDone={returnToToday}
    />
  );

  function goToReview() {
    setError(null);
    if (!seedOk) {
      const diff = actualQty - seedSum;
      setError(
        diff > 0
          ? `Seed lot allocation totals are ${diff} trays short.`
          : `Seed lot allocation totals are ${Math.abs(diff)} trays over.`,
      );
      return;
    }
    if (!materialSumOk) {
      setError("Each material lot group must match actual quantity in trays.");
      return;
    }
    for (const s of seedAllocations) {
      if (s.changeFromPreselected && !s.changeReason) {
        setError("Select a reason for each changed seed lot.");
        return;
      }
      if (s.changeReason === "other" && !s.notes?.trim()) {
        setError("Explanation required for Other lot change reason.");
        return;
      }
    }
    for (const m of materialAllocations) {
      if (!m.materialLotId) {
        setError(`Select a material lot for ${m.materialName}.`);
        return;
      }
      if (m.changeFromPreselected && !m.changeReason) {
        setError("Select a reason for each changed material lot.");
        return;
      }
      if (m.changeReason === "other" && !m.notes?.trim()) {
        setError("Explanation required for Other material lot change.");
        return;
      }
    }
    if (needsDeviation && !deviationReason) {
      setError("Select a deviation reason.");
      return;
    }
    if (
      needsDeviation &&
      deviationReason === "other" &&
      !deviationExplanation.trim()
    ) {
      setError("Explanation required for Other deviation reason.");
      return;
    }
    setStep("review");
  }

  if (step === "review") {
    return (
      <>
        <CompleteSeedingStepper phase="review" />
        <ProductionSummary
          visibleBatchNumber={visibleBatchNumber}
          skuCode={skuCode}
          destination={destination}
          plannedQuantity={plannedQuantity}
          actualQty={actualQty}
          starterName={starterName}
          needsDeviation={needsDeviation}
          reviewValid={reviewValid}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-start">
          <Card className="p-5 sm:p-6">
            <SectionHeader
              title="Review Seeding"
              lead="Nothing is committed until you confirm."
            />
            <dl className="space-y-3">
              <ReviewRow label="Planned" value={`${plannedQuantity} trays`} />
              <ReviewRow
                label="Actual"
                value={`${actualQty} trays`}
                emphasize
              />
              <ReviewRow
                label="Participants"
                value={participantNames.join(", ") || "—"}
              />
              <ReviewRow
                label="Seed allocation"
                value={`${seedSum} / ${actualQty} trays`}
              />
              {seedAllocations.map((s) => (
                <ReviewRow
                  key={s.seedLotId}
                  label={s.seedTypeLabel}
                  value={`Lot ${s.lotNumber} · ${s.quantity} trays${
                    s.changeFromPreselected
                      ? ` · changed (${
                          s.changeReason
                            ? (LOT_CHANGE_REASON_LABELS[
                                s.changeReason as (typeof LOT_CHANGE_REASONS)[number]
                              ] ?? s.changeReason)
                            : "reason needed"
                        })`
                      : ""
                  }`}
                />
              ))}
              {materialAllocations.map((m) => (
                <ReviewRow
                  key={`${m.materialId}-${m.materialLotId}`}
                  label={m.materialName}
                  value={
                    m.lotNumber
                      ? `Lot ${m.lotNumber} · ${m.quantity} trays`
                      : `${m.quantity} trays · no lot selected`
                  }
                />
              ))}
              {needsDeviation ? (
                <ReviewRow
                  label="Deviation"
                  value={
                    deviationReason
                      ? DEVIATION_REASON_LABELS[
                          deviationReason as (typeof SEEDING_DEVIATION_REASONS)[number]
                        ] ?? deviationReason
                      : "Reason needed"
                  }
                  tone="amber"
                />
              ) : null}
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              title="Ready to submit?"
              lead="Required fields must be complete."
            />
            <div
              className={`mb-4 rounded-lg border p-4 text-body-small ${
                reviewValid
                  ? "border-green bg-green-soft text-green-dark"
                  : "border-red bg-red-soft text-red-text"
              }`}
              role="status"
            >
              <p className="font-bold">
                {reviewValid
                  ? "Valid — ready to commit."
                  : "Blocking problems remain — go back and fix allocations or deviation."}
              </p>
              {!seedOk ? (
                <p className="mt-1">
                  Seed lot allocation totals are{" "}
                  {seedDiff > 0
                    ? `${seedDiff} trays short.`
                    : `${seedSum - actualQty} trays over.`}
                </p>
              ) : null}
              {!materialSumOk ? (
                <p className="mt-1">
                  Each material group must equal {actualQty} trays.
                </p>
              ) : null}
            </div>
            <ul className="space-y-2">
              <ReadinessLine
                ok
                label="Participants"
                detail={`${participantNames.length} selected`}
              />
              <ReadinessLine
                ok={!needsDeviation || Boolean(deviationReason)}
                label="Actual quantity"
                detail={`${actualQty} trays`}
              />
              <ReadinessLine
                ok={seedOk && seedLotsValid}
                label="Seed lots"
                detail={`${seedSum} / ${actualQty} trays`}
              />
              <ReadinessLine
                ok={materialSumOk && materialLotsValid}
                label="Material lots"
                detail={
                  materialAllocations.length === 0
                    ? "None required"
                    : `${materialAllocations.length} input${
                        materialAllocations.length === 1 ? "" : "s"
                      }`
                }
              />
            </ul>
            {error ? (
              <p className="mt-3 text-body-small font-semibold text-red" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="primary"
                density="production"
                className="w-full font-bold"
                disabled={isSubmitting || !reviewValid}
                onClick={() => {
                  setError(null);
                  setIsSubmitting(true);
                  void completeSeedingAction(buildPayload()).then((result) => {
                    setIsSubmitting(false);
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    setShowSuccess(true);
                  });
                }}
              >
                {isSubmitting ? "Completing…" : "Complete Seeding"}
              </Button>
              <Button
                variant="secondary"
                density="production"
                className="w-full"
                onClick={() => setStep("complete")}
              >
                Back
              </Button>
            </div>
          </Card>
        </div>
        {completionSuccessOverlay}
      </>
    );
  }

  return (
    <>
      <CompleteSeedingStepper phase="complete" />
      <ProductionSummary
        visibleBatchNumber={visibleBatchNumber}
        skuCode={skuCode}
        destination={destination}
        plannedQuantity={plannedQuantity}
        actualQty={actualQty}
        starterName={starterName}
        needsDeviation={needsDeviation}
        reviewValid={reviewValid}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <SectionHeader
              title="Who participated?"
              lead="Starter stays selected. Add anyone else who worked this run."
            />
            <ChoiceGrid
              multiple
              aria-label="Participants"
              choices={members.map((m) => ({ id: m.id, label: m.name }))}
              selectedIds={participants}
              onSelect={toggleParticipant}
              density="production"
            />
            <p className="mt-3 text-body-small text-muted">
              {starterName
                ? `${starterName} started this task and cannot be removed.`
                : "The worker who started this task cannot be removed."}
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              title="Actual trays produced"
              lead="Enter how many trays were actually seeded."
            />
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[10rem] flex-1">
                <label htmlFor="actual-trays" className="block">
                  <span className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                    Actual trays
                  </span>
                  <input
                    id="actual-trays"
                    type="number"
                    min={1}
                    value={actualQty}
                    aria-describedby="actual-trays-hint"
                    className="mt-1.5 w-full min-h-[56px] rounded-md border border-line bg-surface px-3 py-2 text-kpi font-extrabold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
                    onChange={(e) => applyActualQty(Number(e.target.value))}
                  />
                </label>
              </div>
              <div>
                <p className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                  Planned
                </p>
                <p className="mt-1.5 text-kpi font-extrabold tabular-nums leading-none">
                  {plannedQuantity}
                </p>
                <p className="mt-1 text-caption text-muted">trays</p>
              </div>
            </div>
            <div
              id="actual-trays-hint"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/60 px-4 py-3"
            >
              <p className="text-body-small">
                {needsDeviation ? (
                  <span className="font-semibold text-amber-text">
                    Differs from plan · {trayDiff > 0 ? "+" : ""}
                    {trayDiff} trays
                  </span>
                ) : (
                  <span className="font-semibold text-green-dark">
                    Matches plan · {actualQty} / {plannedQuantity} trays
                  </span>
                )}
              </p>
              {needsDeviation ? (
                <Button
                  type="button"
                  variant="secondary"
                  density="production"
                  className="font-semibold"
                  onClick={() => applyActualQty(plannedQuantity)}
                >
                  Same as planned
                </Button>
              ) : null}
            </div>
            {needsDeviation ? (
              <div
                className="mt-4 space-y-2 rounded-lg border border-amber bg-amber-soft p-4"
                role="group"
                aria-labelledby="deviation-heading"
              >
                <p
                  id="deviation-heading"
                  className="font-semibold text-amber-text"
                >
                  Quantity differs from plan. A deviation is required.
                </p>
                <label className="block">
                  <span className="text-body-small font-semibold">
                    Deviation reason
                  </span>
                  <select
                    className={`mt-1.5 ${selectClassName}`}
                    value={deviationReason}
                    aria-required="true"
                    onChange={(e) => {
                      setDeviationReason(e.target.value);
                      setError(null);
                    }}
                  >
                    <option value="">Select reason</option>
                    {SEEDING_DEVIATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {DEVIATION_REASON_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
                {deviationReason === "other" ? (
                  <Field
                    label="Explanation"
                    value={deviationExplanation}
                    onChange={(e) => setDeviationExplanation(e.target.value)}
                  />
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>

        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Traceability"
            lead="Allocations are in trays (not BOM consumption)."
            action={
              <Pill tone={seedOk && materialSumOk && materialLotsValid ? "green" : "amber"}>
                {seedOk && materialSumOk && materialLotsValid
                  ? "Ready"
                  : "Needs attention"}
              </Pill>
            }
          />

          <div className="rounded-lg border border-line bg-surface-2/50 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-body font-bold">Seed lots</p>
              <p
                className={`text-body-small font-semibold ${
                  seedOk ? "text-green-dark" : "text-red-text"
                }`}
              >
                {seedSum} / {actualQty} trays
              </p>
            </div>
            {requiredSeedVarietyLabels.length > 0 ? (
              <p className="mt-1 text-body-small text-muted">
                Required seed{" "}
                {requiredSeedVarietyLabels.length === 1 ? "variety" : "varieties"}:{" "}
                {requiredSeedVarietyLabels.join(", ")}
              </p>
            ) : null}
          </div>

          {noSeedLots ? (
            <div
              className="mt-3 rounded-lg border border-amber bg-amber-soft p-4 text-body-small text-amber-text"
              role="status"
            >
              <p className="font-semibold">No available seed lot</p>
              <p className="mt-1">
                No AVAILABLE seed lots match this batch&apos;s required variety
                {requiredSeedVarietyLabels.length > 0
                  ? `: ${requiredSeedVarietyLabels.join(", ")}`
                  : ""}
                .
              </p>
              <p className="mt-2">
                Add a seed lot with inventory receipt on{" "}
                <Link
                  href="/materials"
                  className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
                >
                  Materials
                </Link>{" "}
                (requires <code className="text-xs">ENABLE_MATERIALS_ADMIN=true</code>
                ), then return here.
              </p>
            </div>
          ) : null}

          {!seedOk && !noSeedLots ? (
            <p className="mt-3 text-body-small font-semibold text-red-text" role="status">
              {seedAllocations.length === 0
                ? "Seed allocation incomplete — select a lot."
                : seedDiff > 0
                  ? `Seed allocation incomplete — ${seedDiff} trays short.`
                  : `Seed allocation total is ${seedSum - actualQty} trays over.`}
            </p>
          ) : null}

          {seedAllocations.map((s, i) => (
            <div
              key={`${s.seedLotId}-${i}`}
              className="mt-4 rounded-lg border border-line p-4"
            >
              <div className="space-y-2">
                <div>
                  <p className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                    Seed type
                  </p>
                  <p className="mt-1 text-body font-bold leading-snug">
                    {s.seedTypeLabel}
                  </p>
                  {s.seedVarietyName && s.seedVarietyName !== s.seedTypeLabel ? (
                    <p className="mt-0.5 text-caption text-muted">
                      Variety: {s.seedVarietyName}
                    </p>
                  ) : null}
                </div>
                <Pill tone={s.quantity > 0 ? "green" : "red"}>
                  {s.quantity > 0 ? `${s.quantity} trays` : "Qty needed"}
                </Pill>
              </div>
              <label className="mt-3 block">
                <span className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                  Selected lot
                </span>
                <select
                  className={`mt-1.5 ${selectClassName}`}
                  value={s.seedLotId}
                  aria-label={`Seed lot ${i + 1} for ${s.seedTypeLabel}`}
                  onChange={(e) => updateSeedLotId(i, e.target.value)}
                >
                  {availableSeedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {formatSeedLotOption(l)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                  Allocation
                </span>
                <input
                  type="number"
                  data-testid={`seed-allocation-qty-${i}`}
                  aria-label={`Seed allocation trays for ${s.seedTypeLabel}`}
                  className={qtyInputClassName}
                  value={s.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setError(null);
                    setSeedAllocations((prev) =>
                      prev.map((row, idx) =>
                        idx === i ? { ...row, quantity: q } : row,
                      ),
                    );
                  }}
                />
                <span className="text-body-small text-muted">trays</span>
              </label>
              {s.changeFromPreselected ? (
                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className="text-body-small font-semibold">
                      Lot change reason
                    </span>
                    <select
                      className={`mt-1.5 ${selectClassName}`}
                      value={s.changeReason ?? ""}
                      aria-label={`Lot change reason for ${s.seedTypeLabel}`}
                      onChange={(e) =>
                        setSeedAllocations((prev) =>
                          prev.map((row, idx) =>
                            idx === i
                              ? { ...row, changeReason: e.target.value }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="">Select reason</option>
                      {LOT_CHANGE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {LOT_CHANGE_REASON_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {s.changeReason === "other" ? (
                    <Field
                      label="Explanation"
                      value={s.notes ?? ""}
                      onChange={(e) =>
                        setSeedAllocations((prev) =>
                          prev.map((row, idx) =>
                            idx === i ? { ...row, notes: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {seedAllocations.length < availableSeedLots.length ? (
            <Button
              variant="secondary"
              className="mt-3 font-semibold"
              density="production"
              type="button"
              onClick={addSeedLotRow}
            >
              Add seed lot
            </Button>
          ) : null}

          <div className="mt-6 rounded-lg border border-line bg-surface-2/50 px-4 py-3">
            <p className="text-body font-bold">Material lots</p>
            <p className="mt-1 text-body-small text-muted">
              Each required material must equal {actualQty} trays.
            </p>
          </div>

          {materialAllocations.length === 0 ? (
            <p className="mt-3 text-body-small text-muted">
              No material lots are required for this batch.
            </p>
          ) : null}

          {materialAllocations.map((m, i) => {
            const lots = lotsForMaterial(m.materialId);
            const rowOk =
              Boolean(m.materialLotId) && quantitiesEqual(m.quantity, actualQty);
            return (
              <div key={m.materialId} className="mt-4 rounded-lg border border-line p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                      Material
                    </p>
                    <p className="mt-1 text-body font-bold leading-snug">
                      {m.materialName}
                    </p>
                  </div>
                  <Pill tone={rowOk ? "green" : lots.length === 0 ? "amber" : "red"}>
                    {lots.length === 0
                      ? "No lot"
                      : rowOk
                        ? `${m.quantity} trays`
                        : "Needs attention"}
                  </Pill>
                </div>
                {lots.length === 0 ? (
                  <p className="mt-3 text-body-small text-amber-text" role="status">
                    No AVAILABLE material lots for this input. Add one on{" "}
                    <Link
                      href="/materials"
                      className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
                    >
                      Materials
                    </Link>
                    .
                  </p>
                ) : (
                  <label className="mt-3 block">
                    <span className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                      Selected lot
                    </span>
                    <select
                      className={`mt-1.5 ${selectClassName}`}
                      value={m.materialLotId}
                      aria-label={`${m.materialName} lot`}
                      onChange={(e) => updateMaterialLotId(i, e.target.value)}
                    >
                      {lots.map((l) => (
                        <option key={l.id} value={l.id}>
                          Lot {l.lotNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-eyebrow font-extrabold tracking-[0.1em] text-muted uppercase">
                    Allocation
                  </span>
                  <input
                    type="number"
                    aria-label={`${m.materialName} allocation trays`}
                    className={qtyInputClassName}
                    value={m.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                    setError(null);
                    setMaterialAllocations((prev) =>
                      prev.map((row, idx) =>
                        idx === i ? { ...row, quantity: q } : row,
                      ),
                    );
                    }}
                  />
                  <span className="text-body-small text-muted">trays</span>
                </label>
                {!quantitiesEqual(m.quantity, actualQty) ? (
                  <p className="mt-2 text-caption font-semibold text-red-text">
                    Must equal actual quantity ({actualQty} trays).
                  </p>
                ) : null}
                {m.changeFromPreselected ? (
                  <div className="mt-3 space-y-2">
                    <label className="block">
                      <span className="text-body-small font-semibold">
                        Lot change reason
                      </span>
                      <select
                        className={`mt-1.5 ${selectClassName}`}
                        value={m.changeReason ?? ""}
                        aria-label={`Lot change reason for ${m.materialName}`}
                        onChange={(e) =>
                          setMaterialAllocations((prev) =>
                            prev.map((row, idx) =>
                              idx === i
                                ? { ...row, changeReason: e.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="">Select reason</option>
                        {LOT_CHANGE_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {LOT_CHANGE_REASON_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {m.changeReason === "other" ? (
                      <Field
                        label="Explanation"
                        value={m.notes ?? ""}
                        onChange={(e) =>
                          setMaterialAllocations((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, notes: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Card>
      </div>

      {error ? (
        <p className="mt-4 text-body-small font-semibold text-red" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-small text-muted" aria-live="polite">
          {reviewValid
            ? "Completion is valid. Continue to review before committing."
            : missingMaterialLots.length > 0 || noSeedLots || !seedOk
              ? "Fix missing lots or allocation totals before review."
              : needsDeviation && !deviationReason
                ? "Select a deviation reason before review."
                : "Complete required fields before review."}
        </p>
        <Button
          variant="primary"
          density="production"
          className="w-full font-bold sm:w-auto sm:min-w-[220px]"
          onClick={goToReview}
        >
          Continue to review
        </Button>
      </div>
      {completionSuccessOverlay}
    </>
  );
}

function ProductionSummary({
  visibleBatchNumber,
  skuCode,
  destination,
  plannedQuantity,
  actualQty,
  starterName,
  needsDeviation,
  reviewValid,
}: {
  visibleBatchNumber: string;
  skuCode: string;
  destination: string;
  plannedQuantity: number;
  actualQty: number;
  starterName: string | null;
  needsDeviation: boolean;
  reviewValid: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-hero p-0">
      <div className="border-b border-line bg-surface-2/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
              Completing
            </p>
            <p className="mt-1 font-mono text-kpi font-extrabold leading-none tracking-tight text-text">
              {visibleBatchNumber}
            </p>
            <p className="mt-2 truncate text-h2 font-extrabold tracking-[-0.02em]">
              {skuCode}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="amber">In progress</Pill>
            <Pill tone={reviewValid ? "green" : "amber"}>
              {reviewValid ? "Ready to review" : "Check allocations"}
            </Pill>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-4 sm:px-6">
        <div>
          <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
            Planned
          </dt>
          <dd className="mt-1 text-kpi font-extrabold leading-none tabular-nums">
            {plannedQuantity}
          </dd>
          <dd className="mt-1 text-caption text-muted">trays</dd>
        </div>
        <div>
          <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
            Actual
          </dt>
          <dd className="mt-1 text-kpi font-extrabold leading-none tabular-nums">
            {actualQty}
          </dd>
          <dd className="mt-1 text-caption text-muted">
            {needsDeviation ? "differs from plan" : "trays"}
          </dd>
        </div>
        <div>
          <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
            Destination
          </dt>
          <dd className="mt-1 text-h2 font-extrabold leading-tight">
            {destination}
          </dd>
          <dd className="mt-1 text-caption text-muted">Assigned room / pool</dd>
        </div>
        <div>
          <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
            Task
          </dt>
          <dd className="mt-1 text-body font-bold leading-snug">
            Complete seeding
          </dd>
          <dd className="mt-1 text-caption text-muted">
            {starterName ? `Started by ${starterName}` : "In progress"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function ReviewRow({
  label,
  value,
  emphasize,
  tone,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: "amber";
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/70 pb-3 last:border-0 last:pb-0">
      <dt className="text-caption font-bold tracking-[0.08em] text-muted uppercase">
        {label}
      </dt>
      <dd
        className={[
          "text-body-small font-semibold text-right",
          emphasize ? "text-h3 font-extrabold text-text" : "text-text",
          tone === "amber" ? "text-amber-text" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function ReadinessLine({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2">
      <span className="text-body-small font-semibold">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-caption text-muted">{detail}</span>
        <Pill tone={ok ? "green" : "red"}>{ok ? "Complete" : "Fix"}</Pill>
      </span>
    </li>
  );
}
