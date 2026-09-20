"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type SuccessOverlayProps = {
  show: boolean;
  title: string;
  /** Simple body text when `children` is not provided. */
  message?: string;
  children?: ReactNode;
  footer?: string;
  returnAfterMs?: number;
  onDone: () => void;
};

export function SuccessOverlay({
  show,
  title,
  message,
  children,
  footer,
  returnAfterMs = 1400,
  onDone,
}: SuccessOverlayProps) {
  const onDoneRef = useRef(onDone);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) {
      return;
    }
    dialogRef.current?.focus();
    const timer = window.setTimeout(() => onDoneRef.current(), returnAfterMs);
    return () => window.clearTimeout(timer);
  }, [show, returnAfterMs]);

  if (!show || !mounted) {
    return null;
  }

  const bodyContent =
    children ??
    (message ? (
      <p id={bodyId} className="mt-1 text-muted">
        {message}
      </p>
    ) : null);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-6"
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-w-sm rounded-card border border-line bg-surface px-8 py-6 text-center shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        aria-labelledby={titleId}
        aria-describedby={bodyContent ? bodyId : undefined}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-2xl font-bold text-green-dark"
          aria-hidden="true"
        >
          <span aria-hidden="true">✓</span>
        </div>
        <h3 id={titleId} className="mt-3 text-h3 font-bold text-text">
          {title}
        </h3>
        {bodyContent ? (
          <div id={bodyId} className="mt-2">
            {bodyContent}
          </div>
        ) : null}
        {footer ? (
          <p className="mt-4 text-caption font-medium text-muted">{footer}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
