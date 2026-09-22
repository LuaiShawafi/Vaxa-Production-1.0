"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  extendGerminationAction,
  moveToNurseryAction,
} from "@/lib/actions/germination";
import { formatOperationalDayLabel } from "@/lib/date";
import type { Germination402WorkerRow } from "@/lib/domain/germination/germination402ReadModel";
import type { Team402Worker } from "@/lib/db/queries/germination402";
import type { GerminationExtensionPreset } from "@/lib/validation/germination";
import { Germination402List } from "@/components/402/Germination402List";
import { Germination402ActionDrawer } from "@/components/402/Germination402ActionDrawer";

type Germination402WorkerSurfaceProps = {
  dueRows: Germination402WorkerRow[];
  futureRows: Germination402WorkerRow[];
  workers: Team402Worker[];
};

export function Germination402WorkerSurface({
  dueRows,
  futureRows,
  workers,
}: Germination402WorkerSurfaceProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Germination402WorkerRow | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const visibleDue = dueRows;
  const visibleFuture = showAll ? futureRows : [];

  const openBatch = useCallback((row: Germination402WorkerRow) => {
    setSelected(row);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (pending) {
      return;
    }
    setDrawerOpen(false);
    setSelected(null);
  }, [pending]);

  const refreshAfterMutation = useCallback(() => {
    router.refresh();
  }, [router]);

  const runExtend = useCallback(
    (
      batchId: string,
      workerId: string,
      extension:
        | { kind: GerminationExtensionPreset }
        | { kind: "CUSTOM"; customDays: number },
    ) => {
      return extendGerminationAction({
        batchId,
        initiatedByUserId: workerId,
        extension,
      });
    },
    [],
  );

  const runMove = useCallback((batchId: string, workerId: string) => {
    return moveToNurseryAction({
      batchId,
      initiatedByUserId: workerId,
    });
  }, []);

  return (
    <>
      <Germination402List
        dueRows={visibleDue}
        futureRows={visibleFuture}
        showAll={showAll}
        onToggleShowAll={() => setShowAll((v) => !v)}
        hasFuture={futureRows.length > 0}
        onOpenBatch={openBatch}
      />
      <Germination402ActionDrawer
        open={drawerOpen}
        row={selected}
        workers={workers}
        busy={pending}
        onClose={closeDrawer}
        formatExtendedDate={(date) => formatOperationalDayLabel(date)}
        onExtend={(batchId, workerId, extension) =>
          new Promise((resolve) => {
            startTransition(async () => {
              const result = await runExtend(batchId, workerId, extension);
              refreshAfterMutation();
              resolve(result);
            });
          })
        }
        onMove={(batchId, workerId) =>
          new Promise((resolve) => {
            startTransition(async () => {
              const result = await runMove(batchId, workerId);
              refreshAfterMutation();
              resolve(result);
            });
          })
        }
        onSuccessClose={() => {
          closeDrawer();
        }}
      />
    </>
  );
}
