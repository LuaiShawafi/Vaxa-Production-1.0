import {
  failure,
  type ActionFailure,
} from "@/lib/domain/results";

export function assertDevDeletionEnabled(): ActionFailure | null {
  if (process.env.ENABLE_DEV_DATA_DELETION !== "true") {
    return failure(
      "Development data deletion is disabled. Set ENABLE_DEV_DATA_DELETION=true in .env.local.",
    );
  }
  return null;
}
