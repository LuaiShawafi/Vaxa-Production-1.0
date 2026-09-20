"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlanItemDevelopmentAction } from "@/lib/actions/development";
import { Button } from "@/components/ui/Button";

export function DevDeletePlanItemButton({
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
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            "Dev delete: remove plan item and all associated production data?",
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await deletePlanItemDevelopmentAction(
            planItemId,
            planId,
          );
          if (result.ok) {
            router.refresh();
          } else {
            window.alert(result.message);
          }
        });
      }}
    >
      Dev delete item
    </Button>
  );
}
