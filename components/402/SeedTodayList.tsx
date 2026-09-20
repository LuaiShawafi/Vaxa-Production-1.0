import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SeedTodayTaskTable } from "@/components/402/SeedTodayTaskTable";

export type SeedTodayRow = {
  taskId: string;
  batchNumber: string;
  skuCode: string;
  plannedQuantity: string;
  quantityUom: string;
  destination: string;
  status: string;
  starterName: string | null;
};

type SeedTodayListProps = {
  rows: SeedTodayRow[];
};

export function SeedTodayList({ rows }: SeedTodayListProps) {
  return (
    <section aria-label="Seed Today">
      <SectionHeader
        title="Seed Today"
        lead="Only batches scheduled for seeding today."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone="green">
              {rows.length} {rows.length === 1 ? "batch" : "batches"}
            </Pill>
            <Link
              href="/planning"
              className="text-[10px] font-bold text-green-dark no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              Open seeding plan →
            </Link>
          </div>
        }
      />

      {rows.length === 0 ? (
        <SeedTodayEmptyState />
      ) : (
        <SeedTodayTaskTable rows={rows} />
      )}
    </section>
  );
}

function SeedTodayEmptyState() {
  return (
    <Card className="p-6 sm:p-8">
      <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
        Seed Today
      </p>
      <h3 className="mt-2 text-h2 font-extrabold tracking-[-0.02em]">
        No seeding planned for today
      </h3>
      <p className="mt-2 max-w-xl text-body text-muted">
        There are no seeding tasks assigned to 402 for today&apos;s date.
        When a weekly plan includes today, those batches will appear here
        ready to start.
      </p>
      <ul className="mt-4 space-y-2 text-body-small text-muted">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green" aria-hidden />
          <span>
            Confirm today&apos;s date is covered in the weekly plan.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green" aria-hidden />
          <span>
            Publish or keep the draft plan available so Seed Today can list
            the work.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-green" aria-hidden />
          <span>
            Return here when seeding is scheduled — Start opens from each
            row.
          </span>
        </li>
      </ul>
      <div className="mt-6">
        <Link href="/planning" className="inline-flex">
          <Button variant="primary" density="production" className="font-bold">
            Open planning
          </Button>
        </Link>
      </div>
    </Card>
  );
}
