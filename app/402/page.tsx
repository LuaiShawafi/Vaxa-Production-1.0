import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTeam402,
  listSeedTodayForTeam,
} from "@/lib/db/queries/seeding";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { TodaySummary } from "@/components/402/TodaySummary";
import { SeedTodayList } from "@/components/402/SeedTodayList";
import { OPERATIONAL_TIMEZONE } from "@/lib/date";

function formatMorningContext(instant = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: OPERATIONAL_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);

  return `${formatted} · Team production workspace`;
}

export default async function Team402Page() {
  const team = await getTeam402();
  if (!team) {
    notFound();
  }

  const rows = await listSeedTodayForTeam(team.id);

  const completed = rows.filter((row) => row.status === "COMPLETED").length;
  const inProgress = rows.filter((row) => row.status === "IN_PROGRESS").length;
  const remaining = rows.filter(
    (row) => row.status === "OPEN" || row.status === "IN_PROGRESS",
  ).length;

  return (
    <main className="max-w-[1480px]">
      <PageHeader
        eyebrow="402 · Cultivation"
        title="Today"
        description={formatMorningContext()}
        density="production"
        actions={
          <Link href="/planning" className="inline-flex">
            <Button variant="primary" density="production" className="font-bold">
              Open today&apos;s plan
            </Button>
          </Link>
        }
      />

      <TodaySummary
        counts={{
          total: rows.length,
          remaining,
          inProgress,
          completed,
        }}
      />

      <SeedTodayList rows={rows} />
    </main>
  );
}
