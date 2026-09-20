"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SeedTodayInfoDrawer } from "@/components/402/SeedTodayInfoDrawer";
import { loadSeedTodayTaskInfoAction } from "@/lib/actions/seeding";
import type { SeedTodayTaskInfo } from "@/lib/types/seedTodayTaskInfo";

export type SeedTodayPrimaryAction = {
  label: string;
  href: string;
};

type SeedTodayRowActionsProps = {
  taskId: string;
  primaryAction: SeedTodayPrimaryAction | null;
  onOpenInfo: (taskId: string) => void;
};

export function SeedTodayRowActions({
  taskId,
  primaryAction,
  onOpenInfo,
}: SeedTodayRowActionsProps) {
  return (
    <div className="flex flex-row items-center justify-end gap-1.5">
      {primaryAction ? (
        <Link href={primaryAction.href} className="inline-flex">
          <Button
            variant="primary"
            density="production"
            className="min-h-12 min-w-[5.5rem] px-4 text-body-small font-bold"
          >
            {primaryAction.label}
          </Button>
        </Link>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        density="production"
        className="min-h-12 min-w-12 px-3 text-body-small font-bold"
        onClick={() => onOpenInfo(taskId)}
      >
        Info
      </Button>
    </div>
  );
}

type SeedTodayInfoControllerProps = {
  children: (api: {
    openInfo: (taskId: string) => void;
  }) => React.ReactNode;
};

/**
 * Owns a single Info drawer for the Seed Today list (avoids duplicate drawers
 * when mobile + desktop action clusters both mount).
 */
export function SeedTodayInfoController({
  children,
}: SeedTodayInfoControllerProps) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<SeedTodayTaskInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const openInfo = useCallback((taskId: string) => {
    setOpen(true);
    setInfo(null);
    setError(null);
    startTransition(async () => {
      const result = await loadSeedTodayTaskInfoAction(taskId);
      if (!result.ok) {
        setInfo(null);
        setError(result.message);
        return;
      }
      setInfo(result.data);
      setError(null);
    });
  }, []);

  return (
    <>
      {children({ openInfo })}
      <SeedTodayInfoDrawer
        open={open}
        loading={isPending}
        error={error}
        info={info}
        onClose={close}
      />
    </>
  );
}
