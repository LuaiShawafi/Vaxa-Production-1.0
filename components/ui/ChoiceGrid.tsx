"use client";

type Choice = { id: string; label: string };

type ChoiceGridProps = {
  choices: Choice[];
  selectedId?: string | null;
  selectedIds?: string[];
  multiple?: boolean;
  onSelect: (id: string) => void;
  density?: "management" | "production";
};

export function ChoiceGrid({
  choices,
  selectedId,
  selectedIds,
  multiple,
  onSelect,
  density = "production",
}: ChoiceGridProps) {
  const minH = density === "production" ? "min-h-[48px]" : "min-h-[40px]";
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {choices.map((choice) => {
        const selected = multiple
          ? selectedIds?.includes(choice.id)
          : selectedId === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice.id)}
            className={[
              "rounded-md border px-3 py-2 text-left font-semibold transition-colors",
              minH,
              selected
                ? "border-green-dark bg-green-soft text-green-dark"
                : "border-line bg-surface hover:bg-surface-2",
            ].join(" ")}
          >
            {choice.label}
            {selected ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}
