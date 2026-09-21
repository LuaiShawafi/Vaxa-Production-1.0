import { notFound } from "next/navigation";
import { ActiveBatchDetailView } from "@/components/batches/ActiveBatchDetailView";
import { getActiveBatchDetail } from "@/lib/db/queries/activeBatches";
import { listActiveUsers } from "@/lib/db/queries/batches";

type PageProps = { params: Promise<{ batchId: string }> };

export default async function ActiveBatchDetailPage({ params }: PageProps) {
  const { batchId } = await params;
  const [batch, users] = await Promise.all([
    getActiveBatchDetail(batchId),
    listActiveUsers(),
  ]);

  if (!batch) {
    notFound();
  }

  return <ActiveBatchDetailView batch={batch} users={users} />;
}
