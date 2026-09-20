"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWeeklyPlanAction } from "@/lib/actions/planning";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { currentOperationalIsoWeek } from "@/lib/date";

export function CreateWeeklyPlanForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const week = new FormData(e.currentTarget).get("week");
        startTransition(async () => {
          const result = await createWeeklyPlanAction(String(week));
          if (!result.ok) {
            setError(result.message);
            return;
          }
          router.push(`/planning/${result.data.id}`);
          router.refresh();
        });
      }}
    >
      <Field
        label="ISO week"
        name="week"
        required
        placeholder="2026-W38"
        defaultValue={currentOperationalIsoWeek()}
        className="min-w-[200px]"
      />
      <Button type="submit" variant="primary" disabled={pending}>
        Create plan
      </Button>
      {error ? <p className="w-full text-red">{error}</p> : null}
    </form>
  );
}
