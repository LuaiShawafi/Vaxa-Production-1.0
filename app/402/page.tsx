import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

/**
 * Route shell only. The 402 dashboard sections (Today's Plan, Seed Today,
 * Germination -> Nursery, Nursery, Transplanting, Send for Transplanting,
 * Flat Tray Harvest, Microgreen Box Packing, Other Tasks) are implemented in
 * the next phase. This page intentionally performs no database access.
 */
export default function Team402Page() {
  return (
    <main className="px-6 py-7 tablet:px-8">
      <p className="text-eyebrow font-bold tracking-[0.12em] text-muted uppercase">
        Team 402
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-h1 font-extrabold tracking-[-0.02em]">
          402 Production
        </h1>
        <Pill tone="blue">Foundation</Pill>
      </div>
      <p className="mt-2 text-muted">
        Application foundation is in place. Production workflows are not
        implemented yet.
      </p>

      <Card className="mt-6 p-5">
        <h2 className="text-h3 font-bold">Next implementation phase</h2>
        <p className="mt-2 text-body-small text-muted">
          The first vertical slice is 402 Seeding: Seed Today, Start, worker
          selection, Complete, participants, actual quantity, lot allocation,
          review, commit, and the automatic transition to Germination.
        </p>
      </Card>
    </main>
  );
}
