import { listActiveBatches } from "@/lib/db/queries/activeBatches";
import { ActiveBatchSection } from "@/components/batches/ActiveBatchSection";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  activeBatchSectionCopy,
  presentActiveBatchesOverview,
} from "@/lib/batches/activeBatchOverviewPresentation";

export default async function ActiveBatchesPage() {
  const model = await listActiveBatches();
  const overview = presentActiveBatchesOverview(model, new Date());

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Batches"
        description={`Active growing batches in germination and nursery. ${overview.summary}.`}
      />

      <div className="space-y-8">
        <ActiveBatchSection
          title={activeBatchSectionCopy.germination.title}
          lead={activeBatchSectionCopy.germination.lead}
          emptyMessage={activeBatchSectionCopy.germination.empty}
          rows={overview.germination}
        />
        <ActiveBatchSection
          title={activeBatchSectionCopy.nursery.title}
          lead={activeBatchSectionCopy.nursery.lead}
          emptyMessage={activeBatchSectionCopy.nursery.empty}
          rows={overview.nursery}
        />
      </div>
    </main>
  );
}
