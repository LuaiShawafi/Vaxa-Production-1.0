"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishWeeklyPlanAction } from "@/lib/actions/planning";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PublishPlanButtonProps = {
  planId: string;
  itemCount: number;
  /** Header trigger only — parent renders the confirm panel. */
  onRequestConfirm?: () => void;
  /** Full-width confirm panel below the header. */
  confirmOpen?: boolean;
  onConfirmClose?: () => void;
};

export function PublishPlanButton({
  planId,
  itemCount,
  onRequestConfirm,
  confirmOpen = false,
  onConfirmClose,
}: PublishPlanButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [internalConfirm, setInternalConfirm] = useState(false);

  const isControlled = onRequestConfirm != null || onConfirmClose != null;
  const showConfirm = isControlled ? confirmOpen : internalConfirm;

  const closeConfirm = () => {
    if (onConfirmClose) {
      onConfirmClose();
    } else {
      setInternalConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <Card className="p-5">
        <p className="font-semibold">Publish this plan?</p>
        <p className="mt-1 text-body-small text-muted">
          This creates batches and production tasks for each item. Open plan
          items stay editable until production starts on that item.
        </p>
        {error ? (
          <p className="mt-2 text-red" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
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
                closeConfirm();
              });
            }}
          >
            Confirm publish
          </Button>
          <Button variant="secondary" onClick={closeConfirm}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Button
      variant="primary"
      disabled={itemCount === 0}
      onClick={() => {
        if (onRequestConfirm) {
          onRequestConfirm();
        } else {
          setInternalConfirm(true);
        }
      }}
    >
      Publish plan
    </Button>
  );
}
