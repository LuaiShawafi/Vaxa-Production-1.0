type CompletePhase = "complete" | "review";

const STEPS = [
  { id: "participants", label: "Participants" },
  { id: "production", label: "Production" },
  { id: "traceability", label: "Traceability" },
  { id: "review", label: "Review" },
] as const;

/**
 * Presentational progress only. The wizard still has two real states:
 * completion data and review. Steps 1–3 map to the completion form.
 */
export function CompleteSeedingStepper({ phase }: { phase: CompletePhase }) {
  return (
    <ol
      aria-label="Completion progress"
      className="mb-6 flex flex-wrap gap-2"
    >
      {STEPS.map((step, index) => {
        const isReviewStep = step.id === "review";
        const state =
          phase === "review"
            ? isReviewStep
              ? "current"
              : "done"
            : isReviewStep
              ? "upcoming"
              : "current";

        return (
          <li key={step.id}>
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={[
                "inline-flex min-h-[36px] items-center rounded-pill px-3 py-1.5",
                "text-caption font-extrabold tracking-[0.04em]",
                state === "current"
                  ? "bg-green-soft text-green-dark"
                  : state === "done"
                    ? "bg-surface-2 text-text"
                    : "bg-surface-2 text-muted",
              ].join(" ")}
            >
              {index + 1} · {step.label}
              {state === "done" ? " ✓" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
