"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
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
  layout?: "grid" | "stack";
  showSubmit?: boolean;
  formId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
};

const selectClassName = [
  "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
  "disabled:opacity-60",
].join(" ");

export function PlanItemForm({
  planId,
  skus,
  teams,
  initial,
  lockSku = false,
  defaultPlannedDate,
  onSuccess,
  layout = "grid",
  showSubmit = true,
  formId,
  onDirtyChange,
  onPendingChange,
}: PlanItemFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const generatedId = useId();
  const idPrefix = formId ?? generatedId;

  const team402 = teams.find((t) => t.name === "402");
  const stacked = layout === "stack";
  const controlClassName = stacked
    ? `${selectClassName} min-h-11`
    : selectClassName;

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  const skuField = (
    <label className="block" htmlFor={`${idPrefix}-sku`}>
      <span className="text-body-small font-semibold">SKU</span>
      {lockSku && stacked ? (
        <span className="mt-0.5 block text-caption text-muted">
          SKU cannot change after publish.
        </span>
      ) : null}
      <select
        id={`${idPrefix}-sku`}
        name="skuId"
        required
        disabled={lockSku || pending}
        defaultValue={initial?.skuId}
        className={controlClassName}
      >
        {skus.map((sku) => (
          <option key={sku.id} value={sku.id}>
            {sku.code}
          </option>
        ))}
      </select>
    </label>
  );

  const dateField = (
    <Field
      id={`${idPrefix}-planned-date`}
      label="Planned date"
      name="plannedDate"
      type="date"
      required
      disabled={pending}
      className={stacked ? "min-h-11" : undefined}
      hint={
        stacked
          ? "Must be a planning day in this ISO week. Changing the date moves this item to that weekday."
          : undefined
      }
      defaultValue={
        initial
          ? formatDateInput(initial.plannedDate)
          : (defaultPlannedDate ?? operationalTodayString())
      }
    />
  );

  const quantityField = (
    <Field
      id={`${idPrefix}-planned-quantity`}
      label="Planned quantity (trays)"
      name="plannedQuantity"
      type="number"
      min={1}
      step="1"
      required
      disabled={pending}
      className={stacked ? "min-h-11" : undefined}
      defaultValue={initial?.plannedQuantity ?? "35"}
    />
  );

  const teamField = (
    <label className="block" htmlFor={`${idPrefix}-team`}>
      <span className="text-body-small font-semibold">Assigned team</span>
      <select
        id={`${idPrefix}-team`}
        name="assignedTeamId"
        required
        disabled={pending}
        defaultValue={initial?.assignedTeamId ?? team402?.id}
        className={controlClassName}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );

  const destinationField = (
    <label className="block" htmlFor={`${idPrefix}-destination`}>
      <span className="text-body-small font-semibold">Destination</span>
      <select
        id={`${idPrefix}-destination`}
        name="destinationIdentity"
        required
        disabled={pending}
        defaultValue={initial?.destinationIdentity ?? "402"}
        className={controlClassName}
      >
        {ALLOWED_DESTINATIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-caption text-muted">
        Batch number is fixed at publish; changing destination updates the plan
        only.
      </span>
    </label>
  );

  const errorMessage = error ? (
    <p
      className={stacked ? "text-red" : "text-red md:col-span-2"}
      role="alert"
    >
      {error}
    </p>
  ) : null;

  const submitControl = showSubmit ? (
    <div className={stacked ? undefined : "md:col-span-2"}>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending
          ? "Saving…"
          : initial
            ? "Save plan item"
            : "Add plan item"}
      </Button>
    </div>
  ) : null;

  return (
    <form
      id={formId}
      className={stacked ? "flex flex-col gap-5" : "grid gap-3 md:grid-cols-2"}
      onInput={() => onDirtyChange?.(true)}
      onChange={() => onDirtyChange?.(true)}
      onSubmit={(e) => {
        e.preventDefault();
        if (submittingRef.current) {
          return;
        }
        submittingRef.current = true;
        onPendingChange?.(true);
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
            submittingRef.current = false;
            onPendingChange?.(false);
            setError(result.message);
            return;
          }
          if (!initial) {
            formEl.reset();
          }
          onDirtyChange?.(false);
          router.refresh();
          onSuccess?.();
        });
      }}
    >
      {stacked ? (
        <>
          <section className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-[0.08em] text-muted">
              What
            </h3>
            {skuField}
            {dateField}
          </section>
          <section className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-[0.08em] text-muted">
              How much
            </h3>
            {quantityField}
          </section>
          <section className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-[0.08em] text-muted">
              Where / who
            </h3>
            {teamField}
            {destinationField}
          </section>
          {errorMessage}
          {submitControl}
        </>
      ) : (
        <>
          {skuField}
          {dateField}
          {quantityField}
          {teamField}
          {destinationField}
          {errorMessage}
          {submitControl}
        </>
      )}
    </form>
  );
}
