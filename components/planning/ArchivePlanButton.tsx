"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { archiveWeeklyPlanAction } from "@/lib/actions/planning";

export function ArchivePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Archive this plan? It will be hidden from the active list. Production work on the floor continues.",
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await archiveWeeklyPlanAction(planId);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            router.push("/planning");
            router.refresh();
          });
        }}
      >
        Archive plan
      </Button>
      {error ? <p className="mt-2 text-red text-body-small">{error}</p> : null}
    </div>
  );
}
