import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
  /** Production-floor targets are at least 44px; management density uses 40px. */
  density?: "management" | "production";
};

const variantClasses = {
  primary: "bg-green-dark border-green-dark text-white",
  secondary: "bg-surface border-line text-text",
} as const;

const densityClasses = {
  management: "min-h-[40px]",
  production: "min-h-[48px] text-body",
} as const;

export function Button({
  variant = "secondary",
  density = "management",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "rounded-md border px-4 shadow-button transition-opacity",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
        "disabled:opacity-50",
        variantClasses[variant],
        densityClasses[density],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
