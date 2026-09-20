"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { deleteEmptyDraftWeeklyPlanAction } from "@/lib/actions/planning";

export function DeleteEmptyDraftPlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="border-red/40 text-red-text"
        disabled={pending}
        aria-label="Delete empty draft plan"
        onClick={() => {
          if (!window.confirm("Delete this empty draft plan?")) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await deleteEmptyDraftWeeklyPlanAction(planId);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            router.push("/planning");
            router.refresh();
          });
        }}
      >
        Delete empty draft
      </Button>
      {error ? <p className="mt-2 text-red text-body-small">{error}</p> : null}
    </div>
  );
}
