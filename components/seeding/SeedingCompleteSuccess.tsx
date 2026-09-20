"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SeedingSuccessConfirmation } from "@/components/seeding/SeedingSuccessConfirmation";

type SeedingCompleteSuccessProps = {
  visibleBatchNumber: string;
  skuCode: string;
  trayQuantity: number;
  destination?: string;
};

export function SeedingCompleteSuccess({
  visibleBatchNumber,
  skuCode,
  trayQuantity,
  destination,
}: SeedingCompleteSuccessProps) {
  const router = useRouter();
  const returnToToday = useCallback(() => {
    router.replace("/402");
    router.refresh();
  }, [router]);

  return (
    <SeedingSuccessConfirmation
      show
      variant="completed"
      visibleBatchNumber={visibleBatchNumber}
      skuCode={skuCode}
      trayQuantity={trayQuantity}
      destination={destination}
      onDone={returnToToday}
    />
  );
}
