"use client";

type Choice = { id: string; label: string };

type ChoiceGridProps = {
  choices: Choice[];
  selectedId?: string | null;
  selectedIds?: string[];
  multiple?: boolean;
  onSelect: (id: string) => void;
  density?: "management" | "production";
  /** Accessible name for the choice group (radiogroup / group). */
  "aria-label"?: string;
  /** Optional id of an external label element. */
  "aria-labelledby"?: string;
};

export function ChoiceGrid({
  choices,
  selectedId,
  selectedIds,
  multiple,
  onSelect,
  density = "production",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ChoiceGridProps) {
  const minH = density === "production" ? "min-h-[48px]" : "min-h-[40px]";
  const groupRole = multiple ? "group" : "radiogroup";

  return (
    <div
      role={groupRole}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {choices.map((choice) => {
        const selected = multiple
          ? Boolean(selectedIds?.includes(choice.id))
          : selectedId === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => onSelect(choice.id)}
            className={[
              "rounded-md border px-3 py-2 text-left font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
              minH,
              selected
                ? "border-green-dark bg-green-soft text-green-dark ring-1 ring-green-dark/30"
                : "border-line bg-surface hover:bg-surface-2",
            ].join(" ")}
          >
            <span className="flex items-center justify-between gap-2">
              <span>{choice.label}</span>
              {selected ? (
                <span
                  className="shrink-0 text-caption font-bold"
                  aria-hidden="true"
                >
                  ✓
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
