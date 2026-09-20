"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  headerAside?: ReactNode;
  closeDisabled?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  initialFocus?: "panel" | "first-content";
  closeDensity?: "management" | "production";
  closeClassName?: string;
  busy?: boolean;
  restoreFocusRef?: MutableRefObject<HTMLElement | null>;
};

export function Drawer({
  open,
  onClose,
  children,
  footer,
  eyebrow,
  title,
  subtitle,
  headerAside,
  closeDisabled = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  trapFocus = false,
  initialFocus = "panel",
  closeDensity = "management",
  closeClassName,
  busy = false,
  restoreFocusRef,
}: DrawerProps) {
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const titleId = generatedTitleId;
  const descriptionId = subtitle ? generatedDescriptionId : undefined;
  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeDisabledRef = useRef(closeDisabled);
  const closeOnEscapeRef = useRef(closeOnEscape);
  const trapFocusRef = useRef(trapFocus);
  const onCloseRef = useRef(onClose);
  closeDisabledRef.current = closeDisabled;
  closeOnEscapeRef.current = closeOnEscape;
  trapFocusRef.current = trapFocus;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (initialFocus === "first-content" && bodyRef.current) {
        const contentFocusable = getFocusable(bodyRef.current);
        if (contentFocusable[0]) {
          contentFocusable[0].focus();
          return;
        }
      }
      panelRef.current?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (closeDisabledRef.current || !closeOnEscapeRef.current) {
          return;
        }
        onCloseRef.current();
        return;
      }

      if (!trapFocusRef.current || event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const nodes = getFocusable(panelRef.current);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      const active = document.activeElement;
      const containsActive = panelRef.current.contains(active);

      if (event.shiftKey) {
        if (active === first || !containsActive) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !containsActive) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const restoreTarget =
        restoreFocusRef?.current ?? previouslyFocused.current;
      restoreTarget?.focus();
    };
  }, [open, initialFocus, restoreFocusRef]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-[rgba(18,26,21,0.22)]"
      role="presentation"
      onClick={() => {
        if (closeOnOverlayClick && !closeDisabled) {
          onClose();
        }
      }}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy || undefined}
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-[min(560px,94vw)] flex-col border-l border-line bg-surface shadow-[-20px_0_55px_rgba(0,0,0,0.12)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="mt-1 truncate text-h2 font-extrabold tracking-[-0.02em]"
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                id={descriptionId}
                className="mt-1 text-body-small text-muted"
              >
                {subtitle}
              </p>
            ) : null}
            {headerAside}
          </div>
          <Button
            type="button"
            variant="secondary"
            density={closeDensity}
            className={["shrink-0", closeClassName].filter(Boolean).join(" ")}
            disabled={closeDisabled}
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div
          ref={bodyRef}
          data-drawer-body=""
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-line bg-surface px-5 py-4">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
