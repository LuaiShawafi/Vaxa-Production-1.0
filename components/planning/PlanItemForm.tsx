"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  createPlanItemAction,
  updatePlanItemAction,
} from "@/lib/actions/planning";
import { ALLOWED_DESTINATIONS } from "@/lib/constants";
import { formatDateInput, operationalTodayString } from "@/lib/date";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

type PlanItemFormProps = {
  planId: string;
  skus: Sku[];
  teams: Team[];
  initial?: {
    planItemId: string;
    skuId: string;
    plannedDate: Date;
    plannedQuantity: string;
    assignedTeamId: string;
    destinationIdentity: string;
  };
  /** Published + OPEN: SKU cannot change after materialisation. */
  lockSku?: boolean;
  /** Default planned date (YYYY-MM-DD) for add-to-day flows. */
  defaultPlannedDate?: string;
  onSuccess?: () => void;
};

export function PlanItemForm({
  planId,
  skus,
  teams,
  initial,
  lockSku = false,
  defaultPlannedDate,
  onSuccess,
}: PlanItemFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const team402 = teams.find((t) => t.name === "402");

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        const payload = {
          planId,
          skuId: String(form.get("skuId")),
          plannedDate: String(form.get("plannedDate")),
          plannedQuantity: Number(form.get("plannedQuantity")),
          assignedTeamId: String(form.get("assignedTeamId")),
          destinationIdentity: String(form.get("destinationIdentity")),
        };

        startTransition(async () => {
          const result = initial
            ? await updatePlanItemAction({
                ...payload,
                planItemId: initial.planItemId,
              })
            : await createPlanItemAction(payload);

          if (!result.ok) {
            setError(result.message);
            return;
          }
          if (!initial) {
            formEl.reset();
          }
          router.refresh();
          onSuccess?.();
        });
      }}
    >
      <label className="block text-body-small font-semibold">
        SKU
        <select
          name="skuId"
          required
          disabled={lockSku}
          defaultValue={initial?.skuId}
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 disabled:opacity-60"
        >
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.code}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Planned date"
        name="plannedDate"
        type="date"
        required
        defaultValue={
          initial
            ? formatDateInput(initial.plannedDate)
            : (defaultPlannedDate ?? operationalTodayString())
        }
      />

      <Field
        label="Planned quantity (trays)"
        name="plannedQuantity"
        type="number"
        min={1}
        step="1"
        required
        defaultValue={initial?.plannedQuantity ?? "35"}
      />

      <label className="block text-body-small font-semibold">
        Assigned team
        <select
          name="assignedTeamId"
          required
          defaultValue={initial?.assignedTeamId ?? team402?.id}
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-body-small font-semibold">
        Destination
        <select
          name="destinationIdentity"
          required
          defaultValue={initial?.destinationIdentity ?? "402"}
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          {ALLOWED_DESTINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className="mt-1 block text-caption text-muted">
          Batch number is fixed at publish; changing destination updates the plan only.
        </span>
      </label>

      {error ? <p className="text-red md:col-span-2">{error}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {initial ? "Save plan item" : "Add plan item"}
        </Button>
      </div>
    </form>
  );
}
