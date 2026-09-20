/**
 * Visible batch number: DDMM + destinationIdentity (e.g. 09 Sep + 402 → 0909402).
 * DDMM uses the operational calendar date stored on PlanItem.plannedDate.
 */
export function deriveVisibleBatchNumber(
  plannedDate: Date,
  destinationIdentity: string,
): string {
  const day = plannedDate.getUTCDate().toString().padStart(2, "0");
  const month = (plannedDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const dest = destinationIdentity.trim();
  return `${day}${month}${dest}`;
}
