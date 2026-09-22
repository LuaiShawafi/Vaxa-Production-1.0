"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { changeBatchDestinationAction } from "@/lib/actions/batches";
import { ALLOWED_DESTINATIONS } from "@/lib/constants";
import { DESTINATION_CHANGE_REASONS } from "@/lib/validation/destination";

type User = { id: string; name: string };

export function ChangeDestinationForm({
  batchId,
  currentDestination,
  users,
}: {
  batchId: string;
  currentDestination: string;
  users: User[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await changeBatchDestinationAction({
            batchId,
            toDestination: String(form.get("toDestination")),
            initiatedByUserId: String(form.get("initiatedByUserId")),
            reasonCode: String(form.get("reasonCode")),
            explanation: String(form.get("explanation") || "") || undefined,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          router.refresh();
        });
      }}
    >
      <label className="block text-body-small font-semibold md:col-span-2">
        New destination
        <select
          name="toDestination"
          required
          defaultValue=""
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          <option value="" disabled>Select…</option>
          {ALLOWED_DESTINATIONS.filter((d) => d !== currentDestination).map(
            (d) => (
              <option key={d} value={d}>{d}</option>
            ),
          )}
        </select>
      </label>

      <label className="block text-body-small font-semibold">
        Recorded by
        <select
          name="initiatedByUserId"
          required
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </label>

      <label className="block text-body-small font-semibold">
        Reason
        <select
          name="reasonCode"
          required
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          {DESTINATION_CHANGE_REASONS.map((r) => (
            <option key={r} value={r}>
              {r.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-body-small font-semibold md:col-span-2">
        Explanation (required for &quot;other&quot;)
        <textarea
          name="explanation"
          rows={2}
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2"
        />
      </label>

      {error ? <p className="text-red md:col-span-2">{error}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          Change destination
        </Button>
      </div>
    </form>
  );
}
