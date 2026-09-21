import { ChangeDestinationForm } from "@/components/batches/ChangeDestinationForm";
import { ActiveBatchProductionHistory } from "@/components/batches/ActiveBatchProductionHistory";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { InfoRows } from "@/components/ui/InfoRows";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  presentActiveBatchDetailIdentity,
  presentActiveBatchDetailTiming,
  presentActiveBatchStageLabel,
} from "@/lib/batches/activeBatchDetailPresentation";
import type { ActiveBatchDetail } from "@/lib/domain/batches/activeBatchDetailReadModel";

type ActiveUser = { id: string; name: string };

export function ActiveBatchDetailView({
  batch,
  users,
}: {
  batch: ActiveBatchDetail;
  users: ActiveUser[];
}) {
  return (
    <main className="mx-auto min-w-0 max-w-3xl wrap-break-word">
      <PageHeader
        eyebrow="Batches"
        title={batch.visibleBatchNumber}
        description={batch.skuCode}
        status={
          <Pill tone="blue">
            {presentActiveBatchStageLabel(batch.currentStage)}
          </Pill>
        }
        backLink={{ href: "/batches/active", label: "← Batches" }}
      />

      <Card className="mt-6 min-w-0 p-5 wrap-break-word">
        <InfoRows rows={presentActiveBatchDetailIdentity(batch)} />
      </Card>

      <div className="mt-8">
        <SectionHeader title="Timing" />
      </div>
      <Card className="min-w-0 p-5 wrap-break-word">
        <InfoRows rows={presentActiveBatchDetailTiming(batch)} />
      </Card>

      <div className="mt-8">
        <SectionHeader title="Change destination" />
      </div>
      <Card className="p-5">
        <ChangeDestinationForm
          batchId={batch.id}
          currentDestination={batch.currentDestination}
          users={users}
        />
      </Card>

      <div className="mt-8">
        <SectionHeader title="Production history" />
      </div>
      <ActiveBatchProductionHistory events={batch.productionHistory} />
    </main>
  );
}
