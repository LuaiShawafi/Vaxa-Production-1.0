"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishWeeklyPlanAction } from "@/lib/actions/planning";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PublishPlanButton({
  planId,
  itemCount,
}: {
  planId: string;
  itemCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <Button
        variant="primary"
        disabled={itemCount === 0}
        onClick={() => setConfirm(true)}
      >
        Publish plan
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <p className="font-semibold">Publish this plan?</p>
      <p className="mt-1 text-body-small text-muted">
        This creates batches and production tasks. Plan items become read-only.
      </p>
      {error ? <p className="mt-2 text-red">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await publishWeeklyPlanAction(planId);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              router.refresh();
              setConfirm(false);
            });
          }}
        >
          Confirm publish
        </Button>
        <Button variant="secondary" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
