"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlanItemAction } from "@/lib/actions/planning";
import { Button } from "@/components/ui/Button";

export function DeletePlanItemButton({
  planItemId,
  planId,
}: {
  planItemId: string;
  planId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className="text-caption"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await deletePlanItemAction(planItemId, planId);
          if (result.ok) {
            router.refresh();
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
