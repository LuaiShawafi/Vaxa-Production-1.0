import Link from "next/link";
import { listWeeklyPlans } from "@/lib/db/queries/planning";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CreateWeeklyPlanForm } from "@/components/planning/CreateWeeklyPlanForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function PlanningPage() {
  const plans = await listWeeklyPlans();

  return (
    <main className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Planning" title="Weekly plans" />

      <Card className="mt-6 p-5">
        <SectionHeader title="Create weekly plan" />
        <CreateWeeklyPlanForm />
      </Card>

      <div className="mt-8">
        <SectionHeader
          title="Plans"
          lead="Active plans only. Archive published plans when the week is closed."
        />
      </div>

      {plans.length === 0 ? (
        <Card className="p-5 text-muted">No weekly plans yet.</Card>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link
                    href={`/planning/${plan.id}`}
                    className="font-bold text-green-dark underline"
                  >
                    {plan.week}
                  </Link>
                  <p className="text-body-small text-muted">
                    {plan.itemCount} item{plan.itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Pill tone={plan.status === "PUBLISHED" ? "green" : "blue"}>
                  {plan.status}
                </Pill>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
