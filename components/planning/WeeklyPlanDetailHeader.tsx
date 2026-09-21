"use client";

import { useState } from "react";
import { WeeklyPlanStatus } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { WeeklyPlanStatusPill } from "@/components/planning/WeeklyPlanStatusPill";
import { DevDeleteWeeklyPlanButton } from "@/components/planning/DevDeleteWeeklyPlanButton";
import { PublishPlanButton } from "@/components/planning/PublishPlanButton";
import { ArchivePlanButton } from "@/components/planning/ArchivePlanButton";
import { DeleteEmptyDraftPlanButton } from "@/components/planning/DeleteEmptyDraftPlanButton";

type WeeklyPlanDetailHeaderProps = {
  planId: string;
  week: string;
  status: WeeklyPlanStatus;
  itemCount: number;
  devDeletionEnabled: boolean;
};

function planHeaderDescription(status: WeeklyPlanStatus): string {
  switch (status) {
    case WeeklyPlanStatus.ARCHIVED:
      return "Archived — read-only history.";
    case WeeklyPlanStatus.DRAFT:
      return "Add items by day, then publish when ready.";
    case WeeklyPlanStatus.PUBLISHED:
      return "Open plan items stay editable until production starts on each item.";
    default:
      return "";
  }
}

export function WeeklyPlanDetailHeader({
  planId,
  week,
  status,
  itemCount,
  devDeletionEnabled,
}: WeeklyPlanDetailHeaderProps) {
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const isDraft = status === WeeklyPlanStatus.DRAFT;
  const isPublished = status === WeeklyPlanStatus.PUBLISHED;
  const isArchived = status === WeeklyPlanStatus.ARCHIVED;
  const isEmptyDraft = isDraft && itemCount === 0;

  const publishButton = isDraft ? (
    <PublishPlanButton
      planId={planId}
      itemCount={itemCount}
      confirmOpen={publishConfirmOpen}
      onRequestConfirm={() => setPublishConfirmOpen(true)}
      onConfirmClose={() => setPublishConfirmOpen(false)}
    />
  ) : null;

  return (
    <div className="mb-7 space-y-4">
      <PageHeader
        eyebrow="Planning"
        title={`Week ${week}`}
        backLink={{ href: "/planning", label: "← Weekly plans" }}
        description={planHeaderDescription(status)}
        status={
          <div className="flex flex-wrap items-center gap-2">
            <WeeklyPlanStatusPill status={status} />
            {devDeletionEnabled ? (
              <DevDeleteWeeklyPlanButton planId={planId} />
            ) : null}
          </div>
        }
        actions={
          isArchived
            ? undefined
            : (
                <div className="flex flex-wrap items-center gap-2">
                  {isEmptyDraft ? (
                    <DeleteEmptyDraftPlanButton planId={planId} />
                  ) : null}
                  {!publishConfirmOpen ? publishButton : null}
                  {isPublished ? <ArchivePlanButton planId={planId} /> : null}
                </div>
              )
        }
      />
      {publishConfirmOpen ? publishButton : null}
    </div>
  );
}
