import { Card } from "@/components/ui/Card";

export type SeedTodayCounts = {
  total: number;
  remaining: number;
  inProgress: number;
  completed: number;
};

type TodaySummaryProps = {
  counts: SeedTodayCounts;
};

export function TodaySummary({ counts }: TodaySummaryProps) {
  const { total, remaining, inProgress, completed } = counts;
  const progressPct =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section
      aria-label="Today summary"
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]"
    >
      <Card className="border-[#244C35] bg-[linear-gradient(135deg,#244C35,#35694A)] p-[15px] text-white shadow-card xl:col-span-1 sm:col-span-2 xl:col-auto">
        <p className="text-eyebrow font-extrabold tracking-[0.12em] text-[#C7DACB] uppercase">
          402 production
        </p>
        <h2 className="mt-1 text-[17px] font-bold leading-tight">
          What needs to happen today
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed text-[#DFEAE1]">
          Seed Today shows only batches scheduled for seeding today. Start
          work from the list below when a batch is ready.
        </p>
        <div
          className="mt-3 h-[7px] overflow-hidden rounded-pill bg-white/[0.18]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Seed Today completion"
        >
          <span
            className="block h-full rounded-pill bg-white"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-[#C7D8CC]">
          {completed} of {total} Seed Today{" "}
          {total === 1 ? "task" : "tasks"} completed
        </p>
      </Card>

      <SummaryStat
        label="Seed Today"
        value={total}
        detail="planned seeding tasks"
        note={
          remaining > 0
            ? `${remaining} still need action`
            : total === 0
              ? "Nothing scheduled"
              : "All seeding done"
        }
        noteTone={remaining > 0 ? "amber" : "green"}
      />
      <SummaryStat
        label="In progress"
        value={inProgress}
        detail="started, not finished"
        note={
          inProgress > 0
            ? "Resume from the list"
            : "No active seeding"
        }
        noteTone={inProgress > 0 ? "amber" : "muted"}
      />
      <SummaryStat
        label="Completed"
        value={completed}
        detail="finished today"
        note={
          completed > 0 ? "Recorded in app" : "None completed yet"
        }
        noteTone={completed > 0 ? "green" : "muted"}
      />
    </section>
  );
}

function SummaryStat({
  label,
  value,
  detail,
  note,
  noteTone,
}: {
  label: string;
  value: number;
  detail: string;
  note: string;
  noteTone: "amber" | "green" | "muted";
}) {
  const noteClass =
    noteTone === "amber"
      ? "text-amber-text"
      : noteTone === "green"
        ? "text-green-dark"
        : "text-muted";

  return (
    <Card className="flex flex-col justify-center p-[15px]">
      <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-kpi font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[10px] text-muted">{detail}</p>
      <p className={`mt-2 text-[10px] ${noteClass}`}>{note}</p>
    </Card>
  );
}
