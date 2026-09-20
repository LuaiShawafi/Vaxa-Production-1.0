"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SuccessOverlayProps = {
  show: boolean;
  title: string;
  message: string;
  onDone: () => void;
};

export function SuccessOverlay({
  show,
  title,
  message,
  onDone,
}: SuccessOverlayProps) {
  const onDoneRef = useRef(onDone);
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
    const timer = window.setTimeout(() => onDoneRef.current(), 1400);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-6"
      role="presentation"
    >
      <div
        className="rounded-card border border-line bg-surface px-8 py-6 text-center shadow-card"
        role="alertdialog"
        aria-live="polite"
        aria-labelledby="success-overlay-title"
        aria-describedby="success-overlay-message"
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-2xl font-bold text-green-dark"
          aria-hidden
        >
          ✓
        </div>
        <h3 id="success-overlay-title" className="mt-3 text-h3 font-bold">
          {title}
        </h3>
        <p id="success-overlay-message" className="mt-1 text-muted">
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
}
