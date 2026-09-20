"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";

type SeedingCompleteSuccessProps = {
  visibleBatchNumber: string;
  skuCode: string;
};

export function SeedingCompleteSuccess({
  visibleBatchNumber,
  skuCode,
}: SeedingCompleteSuccessProps) {
  const router = useRouter();
  const returnToToday = useCallback(() => {
    router.replace("/402");
    router.refresh();
  }, [router]);

  return (
    <SuccessOverlay
      show
      title="Seeding completed"
      message={`${skuCode} · ${visibleBatchNumber} recorded. Batch moved to Germination. Returning to Today…`}
      onDone={returnToToday}
    />
  );
}
