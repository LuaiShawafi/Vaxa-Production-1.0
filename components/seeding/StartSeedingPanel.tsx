"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSeedingAction } from "@/lib/actions/seeding";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Member = { id: string; name: string };

export function StartSeedingPanel({
  taskId,
  teamId,
  members,
  disabled,
}: {
  taskId: string;
  teamId: string;
  members: Member[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    starterName: string;
    startedAt: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return null;
  }

  return (
    <Card className="mt-6 p-5">
      <SectionHeader
        title="Who are you?"
        lead="Shared 402 production device — team members assigned to 402 appear here."
      />
      <ChoiceGrid
        choices={members.map((m) => ({ id: m.id, label: m.name }))}
        selectedId={workerId}
        onSelect={setWorkerId}
        density="production"
      />
      {error ? <p className="mt-3 text-red">{error}</p> : null}
      {conflict ? (
        <Card className="mt-3 border-amber bg-amber-soft p-4">
          <p className="font-semibold text-amber-text">
            Already started by {conflict.starterName}
          </p>
          <p className="text-body-small text-muted">
            Started at {conflict.startedAt}. You can open the task to continue
            work, but cannot take over as starter.
          </p>
          <LinkToTask taskId={taskId} />
        </Card>
      ) : null}
      <Button
        className="mt-4 w-full sm:w-auto"
        variant="primary"
        density="production"
        disabled={!workerId || pending}
        onClick={() => {
          if (!workerId) {
            setError("Select your name before starting.");
            return;
          }
          setError(null);
          setConflict(null);
          startTransition(async () => {
            const result = await startSeedingAction({
              productionTaskId: taskId,
              teamId,
              workerUserId: workerId,
            });
            if (!result.ok) {
              if (result.kind === "conflict" && result.details) {
                setConflict({
                  starterName: String(result.details.starterName),
                  startedAt: new Date(
                    String(result.details.startedAt),
                  ).toLocaleString(),
                });
                return;
              }
              setError(result.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        Start Seeding
      </Button>
    </Card>
  );
}

function LinkToTask({ taskId }: { taskId: string }) {
  return (
    <a href={`/402/seeding/${taskId}`} className="mt-2 inline-block text-green underline">
      View in-progress task
    </a>
  );
}
