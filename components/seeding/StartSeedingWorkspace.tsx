"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SeedingSuccessConfirmation } from "@/components/seeding/SeedingSuccessConfirmation";
import { StartSeedingPanel } from "@/components/seeding/StartSeedingPanel";

type Member = { id: string; name: string };

type StartSeedingWorkspaceProps = {
  showPanel: boolean;
  taskId: string;
  teamId: string;
  members: Member[];
  visibleBatchNumber: string;
  skuCode: string;
  plannedQuantity: number;
  destination: string;
};

/**
 * Keeps start-success confirmation mounted across the OPEN → IN_PROGRESS
 * revalidation that unmounts the start panel.
 */
export function StartSeedingWorkspace({
  showPanel,
  taskId,
  teamId,
  members,
  visibleBatchNumber,
  skuCode,
  plannedQuantity,
  destination,
}: StartSeedingWorkspaceProps) {
  const router = useRouter();
  const [showStartSuccess, setShowStartSuccess] = useState(false);

  const returnToToday = useCallback(() => {
    router.replace("/402");
    router.refresh();
  }, [router]);

  if (!showPanel && !showStartSuccess) {
    return null;
  }

  return (
    <>
      <SeedingSuccessConfirmation
        show={showStartSuccess}
        variant="started"
        visibleBatchNumber={visibleBatchNumber}
        skuCode={skuCode}
        trayQuantity={plannedQuantity}
        destination={destination}
        onDone={returnToToday}
      />
      {showPanel ? (
        <StartSeedingPanel
          taskId={taskId}
          teamId={teamId}
          members={members}
          onStartSuccess={() => setShowStartSuccess(true)}
        />
      ) : null}
    </>
  );
}
