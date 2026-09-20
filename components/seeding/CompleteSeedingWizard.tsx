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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";
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
  plannedQuantity,
  visibleBatchNumber,
  skuCode,
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
  plannedQuantity: number;
  visibleBatchNumber: string;
  skuCode: string;
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

  const completionSuccessOverlay = (
    <SuccessOverlay
      show={showSuccess}
      title="Seeding completed"
      message={`${skuCode} · ${visibleBatchNumber} recorded. Batch moved to Germination. Returning to Today…`}
      onDone={returnToToday}
    />
  );

  if (step === "review") {
    return (
      <>
        <Card className="p-5">
          <SectionHeader title="Review Seeding" lead="Nothing is committed until you confirm." />
          <div
            className={`mb-4 rounded-md border p-3 text-body-small ${
              reviewValid
                ? "border-green bg-green-soft text-green-text"
                : "border-red bg-red-soft text-red"
            }`}
          >
            {reviewValid
              ? "Valid — ready to commit."
              : "Blocking problems remain — go back and fix allocations or deviation."}
            {!seedOk ? (
              <p className="mt-1">
                Seed lot allocation totals are{" "}
                {actualQty - seedSum > 0
                  ? `${actualQty - seedSum} trays short.`
                  : `${seedSum - actualQty} trays over.`}
              </p>
            ) : null}
            {!materialSumOk ? (
              <p className="mt-1">
                Each material group must equal {actualQty} trays.
              </p>
            ) : null}
          </div>
          <ul className="space-y-2 text-body-small">
            <li>Planned: {plannedQuantity} trays</li>
            <li>Actual: {actualQty} trays</li>
            <li>
              Participants:{" "}
              {members
                .filter((m) => participants.includes(m.id))
                .map((m) => m.name)
                .join(", ")}
            </li>
            <li>Seed allocation: {seedSum} / {actualQty} trays</li>
            {seedAllocations.map((s) => (
              <li key={s.seedLotId}>
                {s.seedTypeLabel} · Lot {s.lotNumber}: {s.quantity} trays
                {s.changeFromPreselected ? ` (changed: ${s.changeReason})` : ""}
              </li>
            ))}
            {materialAllocations.map((m) => (
              <li key={m.materialLotId}>
                {m.materialName} {m.lotNumber}: {m.quantity} trays
              </li>
            ))}
            {needsDeviation ? (
              <li className="text-amber">Deviation: {deviationReason}</li>
            ) : null}
          </ul>
          {error ? <p className="mt-3 text-red">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep("complete")}>
              Back
            </Button>
            <Button
              variant="primary"
              density="production"
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
              Complete Seeding
            </Button>
          </div>
        </Card>
        {completionSuccessOverlay}
      </>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeader title="Participants & actual quantity" />
        <ChoiceGrid
          multiple
          choices={members.map((m) => ({ id: m.id, label: m.name }))}
          selectedIds={participants}
          onSelect={toggleParticipant}
        />
        <Field
          className="mt-4"
          label="Actual quantity (trays)"
          type="number"
          min={1}
          value={actualQty}
          onChange={(e) => {
            const v = Number(e.target.value);
            setActualQty(v);
            setSeedAllocations((prev) =>
              prev.length === 1
                ? [{ ...prev[0]!, quantity: v }]
                : prev,
            );
            setMaterialAllocations((prev) =>
              prev.map((m) => ({ ...m, quantity: v })),
            );
          }}
        />
        <p className="mt-2 text-body-small">
          Planned: {plannedQuantity} trays{" "}
          <span className={seedOk ? "text-green" : "text-red"}>
            · Seed {seedSum}/{actualQty}
          </span>
        </p>
        {needsDeviation ? (
          <div className="mt-4 space-y-2 rounded-md border border-amber bg-amber-soft p-3">
            <p className="font-semibold text-amber-text">
              Quantity differs from plan. A deviation is required.
            </p>
            <select
              className="w-full rounded-md border border-line px-3 py-2"
              value={deviationReason}
              onChange={(e) => setDeviationReason(e.target.value)}
            >
              <option value="">Select reason</option>
              {SEEDING_DEVIATION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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

      <Card className="p-5">
        <SectionHeader title="Traceability" lead="Allocations are in trays (not BOM consumption)." />
        <p className="text-body-small font-semibold">Seed</p>
        {requiredSeedVarietyLabels.length > 0 ? (
          <p className="mt-1 text-body-small text-muted">
            Required seed{" "}
            {requiredSeedVarietyLabels.length === 1 ? "variety" : "varieties"}:{" "}
            {requiredSeedVarietyLabels.join(", ")}
          </p>
        ) : null}
        {availableSeedLots.length === 0 ? (
          <div className="mt-3 rounded-md border border-amber bg-amber-soft p-3 text-body-small text-amber-text">
            <p>
              No AVAILABLE seed lots match this batch&apos;s required variety
              {requiredSeedVarietyLabels.length > 0
                ? `: ${requiredSeedVarietyLabels.join(", ")}`
                : ""}
              .
            </p>
            <p className="mt-2">
              Add a seed lot with inventory receipt on{" "}
              <Link href="/materials" className="underline">
                Materials
              </Link>{" "}
              (requires <code className="text-xs">ENABLE_MATERIALS_ADMIN=true</code>
              ), then return here.
            </p>
          </div>
        ) : null}
        {seedAllocations.map((s, i) => (
          <div key={`${s.seedLotId}-${i}`} className="mt-3 space-y-2 border-t border-line pt-3">
            <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
              <p className="text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase">
                Seed type
              </p>
              <p className="mt-0.5 text-[11px] font-bold leading-snug">
                {s.seedTypeLabel}
              </p>
              {s.seedVarietyName && s.seedVarietyName !== s.seedTypeLabel ? (
                <p className="mt-0.5 text-[10px] text-muted">
                  Variety: {s.seedVarietyName}
                </p>
              ) : null}
            </div>
            <label className="block text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase">
              Lot number
            </label>
            <select
              className="w-full min-h-12 rounded-md border border-line px-3 py-2 text-body-small"
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                data-testid={`seed-allocation-qty-${i}`}
                className="w-24 rounded-md border border-line px-2 py-1"
                value={s.quantity}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  setSeedAllocations((prev) =>
                    prev.map((row, idx) =>
                      idx === i ? { ...row, quantity: q } : row,
                    ),
                  );
                }}
              />
              <span className="text-muted">trays</span>
            </div>
            {s.changeFromPreselected ? (
              <div className="space-y-1">
                <select
                  className="w-full rounded-md border border-line px-3 py-2"
                  value={s.changeReason ?? ""}
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
                  <option value="">Lot change reason</option>
                  {LOT_CHANGE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
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
            className="mt-3"
            type="button"
            onClick={addSeedLotRow}
          >
            Add seed lot
          </Button>
        ) : null}
        {materialAllocations.map((m, i) => {
          const lots = lotsForMaterial(m.materialId);
          return (
            <div key={m.materialId} className="mt-4 border-t border-line pt-4">
              <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <p className="text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase">
                  Material
                </p>
                <p className="mt-0.5 text-[11px] font-bold leading-snug">
                  {m.materialName}
                </p>
              </div>
              {lots.length === 0 ? (
                <p className="mt-2 text-body-small text-amber-text">
                  No AVAILABLE material lots for this input. Add one on{" "}
                  <Link href="/materials" className="underline">Materials</Link>.
                </p>
              ) : (
                <>
                  <label className="mt-2 block text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase">
                    Lot number
                  </label>
                <select
                  className="mt-1 w-full min-h-12 rounded-md border border-line px-3 py-2 text-body-small"
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
                </>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded-md border border-line px-2 py-1"
                  value={m.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setMaterialAllocations((prev) =>
                      prev.map((row, idx) =>
                        idx === i ? { ...row, quantity: q } : row,
                      ),
                    );
                  }}
                />
                <span className="text-muted">trays</span>
              </div>
              {m.changeFromPreselected ? (
                <div className="mt-2 space-y-1">
                  <select
                    className="w-full rounded-md border border-line px-3 py-2"
                    value={m.changeReason ?? ""}
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
                    <option value="">Lot change reason</option>
                    {LOT_CHANGE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
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

      {error ? <p className="text-red">{error}</p> : null}

      <Button
        variant="primary"
        density="production"
        onClick={() => {
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
            if (
              s.changeReason === "other" &&
              !s.notes?.trim()
            ) {
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
        }}
      >
        Continue to review
      </Button>
    </div>
    {completionSuccessOverlay}
    </>
  );
}
