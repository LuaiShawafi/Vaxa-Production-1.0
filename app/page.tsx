import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-eyebrow font-bold tracking-[0.12em] text-muted uppercase">
        Växa Production
      </p>
      <h1 className="mt-2 text-h1 font-extrabold tracking-[-0.02em]">
        Application foundation
      </h1>
      <p className="mt-2 text-muted">
        The main Växa-wide dashboard is not implemented yet. Team production
        surfaces are reached per team.
      </p>

      <Card className="mt-6 p-5">
        <h2 className="text-h3 font-bold">Team surfaces</h2>
        <ul className="mt-3">
          <li>
            <Link href="/402" className="text-green underline">
              402 production
            </Link>
          </li>
        </ul>
      </Card>
    </main>
  );
}
