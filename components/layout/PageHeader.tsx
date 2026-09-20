import type { ReactNode } from "react";
import Link from "next/link";

export type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  /** Management pages are denser; production-floor pages use more vertical rhythm. */
  density?: "management" | "production";
  backLink?: { href: string; label: string };
};

export function PageHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
  density = "management",
  backLink,
}: PageHeaderProps) {
  const isProduction = density === "production";

  return (
    <header
      className={[
        isProduction ? "mb-8" : "mb-6",
        backLink ? "space-y-3" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {backLink ? (
        <Link
          href={backLink.href}
          className="text-green underline text-body-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        >
          {backLink.label}
        </Link>
      ) : null}

      <div
        className={[
          "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
          isProduction ? "sm:gap-6" : "sm:gap-5",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-eyebrow font-bold tracking-[0.12em] text-muted uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div
            className={[
              "flex flex-wrap items-center gap-3",
              eyebrow ? "mt-2" : "",
              isProduction ? "mt-1" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <h1
              className={[
                "text-h1 font-extrabold tracking-[-0.02em]",
                isProduction ? "leading-tight" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {title}
            </h1>
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
          {description ? (
            <p
              className={[
                "text-muted",
                isProduction ? "mt-2 text-body" : "mt-1 text-body-small",
              ].join(" ")}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
