import type { ComponentPropsWithoutRef } from "react";

type FieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, className, id, ...props }: FieldProps) {
  const fieldId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block" htmlFor={fieldId}>
      <span className="text-body-small font-semibold">{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-caption text-muted">{hint}</span>
      ) : null}
      <input
        id={fieldId}
        className={[
          "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </label>
  );
}
