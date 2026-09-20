import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Växa Production"
        title="Application foundation"
        description="The main Växa-wide dashboard is not implemented yet. Team production surfaces are reached per team."
      />

      <Card className="p-5">
        <h2 className="text-h3 font-bold">Team surfaces</h2>
        <ul className="mt-3 space-y-1">
          <li>
            <Link href="/planning" className="text-green underline">
              Planning
            </Link>
          </li>
          <li>
            <Link href="/402" className="text-green underline">
              402 production
            </Link>
          </li>
          <li>
            <Link href="/batches/active" className="text-green underline">
              Active batches (germination)
            </Link>
          </li>
          <li>
            <Link href="/materials" className="text-green underline">
              Materials &amp; lot inventory
            </Link>
          </li>
        </ul>
      </Card>
    </main>
  );
}
