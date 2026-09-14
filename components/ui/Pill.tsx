import type { ReactNode } from "react";

/**
 * Semantic status pill. Tone carries operational meaning, not decoration:
 * green = on track/complete, amber = needs attention, red = action required,
 * blue = planned/informational.
 */
type PillTone = "green" | "amber" | "red" | "blue";

const toneClasses: Record<PillTone, string> = {
  green: "bg-green-soft text-green-dark",
  amber: "bg-amber-soft text-amber-text",
  red: "bg-red-soft text-red-text",
  blue: "bg-blue-soft text-blue-text",
};

export function Pill({
  tone,
  children,
}: {
  tone: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-[5px] rounded-pill px-2 py-[6px]",
        "text-caption font-bold",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
