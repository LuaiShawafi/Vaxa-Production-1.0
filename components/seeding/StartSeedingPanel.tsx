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

  const selectedName = members.find((m) => m.id === workerId)?.name ?? null;
  const canSubmit = Boolean(workerId) && !pending;

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <SectionHeader
        title="Who are you?"
        lead="Shared 402 production device — select your name to start."
      />

      {members.length === 0 ? (
        <p className="text-body-small text-muted" role="status">
          No 402 team members are available. Ask CS/CL to assign workers to
          team 402.
        </p>
      ) : (
        <ChoiceGrid
          aria-label="Who are you?"
          choices={members.map((m) => ({ id: m.id, label: m.name }))}
          selectedId={workerId}
          onSelect={(id) => {
            setWorkerId(id);
            setError(null);
          }}
          density="production"
        />
      )}

      {selectedName ? (
        <p className="mt-3 text-body-small text-muted" aria-live="polite">
          Starting as{" "}
          <span className="font-semibold text-text">{selectedName}</span>
        </p>
      ) : (
        <p className="mt-3 text-body-small text-muted">
          Select your name before starting.
        </p>
      )}

      {error ? (
        <p className="mt-3 text-body-small font-semibold text-red" role="alert">
          {error}
        </p>
      ) : null}

      {conflict ? (
        <div
          className="mt-3 rounded-lg border border-amber bg-amber-soft p-4"
          role="status"
        >
          <p className="font-semibold text-amber-text">
            Already started by {conflict.starterName}
          </p>
          <p className="mt-1 text-body-small text-muted">
            Started at {conflict.startedAt}. You can open the task to continue
            work, but cannot take over as starter.
          </p>
          <a
            href={`/402/seeding/${taskId}`}
            className="mt-2 inline-block text-body-small font-semibold text-green underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            View in-progress task
          </a>
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <Button
          className="w-full font-bold"
          variant="primary"
          density="production"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
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
          {pending ? "Starting…" : "Start Seeding"}
        </Button>
      </div>
    </Card>
  );
}
