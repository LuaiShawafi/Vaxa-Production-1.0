"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PlanItemEditDrawer,
  type PlanItemAddSubject,
  type PlanItemDrawerSubject,
  type PlanItemEditSubject,
} from "@/components/planning/PlanItemEditDrawer";
import { planItemDrawerCloseIntent } from "@/lib/planning/planItemAuthoringUi";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

export type { PlanItemAddSubject, PlanItemDrawerSubject, PlanItemEditSubject };

const PlanItemEditContext = createContext<{
  openAdd: (subject: PlanItemAddSubject, trigger: HTMLElement | null) => void;
  openEdit: (subject: PlanItemEditSubject, trigger: HTMLElement | null) => void;
} | null>(null);

export function usePlanItemEdit() {
  const ctx = useContext(PlanItemEditContext);
  if (!ctx) {
    throw new Error("usePlanItemEdit must be used within PlanItemEditController");
  }
  return ctx;
}

export function PlanItemEditController({
  planId,
  skus,
  teams,
  children,
}: {
  planId: string;
  skus: Sku[];
  teams: Team[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<PlanItemDrawerSubject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);
  const returnItemIdRef = useRef<string | null>(null);
  const returnAddDateRef = useRef<string | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    setSubject(null);
    setDirty(false);
    setDiscardPrompt(false);
  }, []);

  const requestClose = useCallback(() => {
    const intent = planItemDrawerCloseIntent({
      pending,
      dirty,
      discardPromptOpen: discardPrompt,
    });
    if (intent === "prompt-discard") {
      setDiscardPrompt(true);
      return;
    }
    if (intent === "close") {
      dismiss();
    }
  }, [pending, dirty, discardPrompt, dismiss]);

  const confirmDiscard = useCallback(() => {
    if (pending) {
      return;
    }
    dismiss();
  }, [pending, dismiss]);

  const keepEditing = useCallback(() => {
    setDiscardPrompt(false);
  }, []);

  const captureOpen = useCallback(
    (next: PlanItemDrawerSubject, trigger: HTMLElement | null) => {
      restoreFocusRef.current = trigger;
      scrollYRef.current = window.scrollY;
      if (next.kind === "add") {
        returnAddDateRef.current = next.dateInput;
        returnItemIdRef.current = null;
      } else {
        returnItemIdRef.current = next.planItemId;
        returnAddDateRef.current = null;
      }
      setSubject(next);
      setDirty(false);
      setPending(false);
      setDiscardPrompt(false);
      setOpen(true);
    },
    [],
  );

  const openAdd = useCallback(
    (next: PlanItemAddSubject, trigger: HTMLElement | null) => {
      captureOpen(next, trigger);
    },
    [captureOpen],
  );

  const openEdit = useCallback(
    (next: PlanItemEditSubject, trigger: HTMLElement | null) => {
      captureOpen(next, trigger);
    },
    [captureOpen],
  );

  const onSuccess = useCallback(() => {
    const y = scrollYRef.current;
    const itemId = returnItemIdRef.current;
    const addDate = returnAddDateRef.current;
    setDirty(false);
    setPending(false);
    setDiscardPrompt(false);
    setOpen(false);
    setSubject(null);
    const restore = () => {
      window.scrollTo(0, y);
      if (itemId) {
        document
          .querySelector<HTMLElement>(`[data-plan-item-edit="${itemId}"]`)
          ?.focus();
        return;
      }
      if (addDate) {
        document
          .querySelector<HTMLElement>(`[data-plan-item-add="${addDate}"]`)
          ?.focus();
      }
    };
    requestAnimationFrame(restore);
    window.setTimeout(restore, 50);
    window.setTimeout(restore, 250);
  }, []);

  const api = useMemo(() => ({ openAdd, openEdit }), [openAdd, openEdit]);

  return (
    <PlanItemEditContext.Provider value={api}>
      {children}
      <PlanItemEditDrawer
        open={open}
        planId={planId}
        skus={skus}
        teams={teams}
        subject={subject}
        dirty={dirty}
        pending={pending}
        discardPrompt={discardPrompt}
        restoreFocusRef={restoreFocusRef}
        onClose={requestClose}
        onConfirmDiscard={confirmDiscard}
        onKeepEditing={keepEditing}
        onSuccess={onSuccess}
        onDirtyChange={setDirty}
        onPendingChange={(next) => {
          setPending(next);
          if (next) {
            setDiscardPrompt(false);
          }
        }}
      />
    </PlanItemEditContext.Provider>
  );
}
