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
  type PlanItemEditSubject,
} from "@/components/planning/PlanItemEditDrawer";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

export type { PlanItemEditSubject };

const PlanItemEditContext = createContext<{
  openEdit: (
    subject: PlanItemEditSubject,
    trigger: HTMLElement | null,
  ) => void;
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
  const [subject, setSubject] = useState<PlanItemEditSubject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);
  const returnItemIdRef = useRef<string | null>(null);

  const close = useCallback(() => {
    if (pending) {
      return;
    }
    setOpen(false);
    setSubject(null);
    setDirty(false);
  }, [pending]);

  const openEdit = useCallback(
    (next: PlanItemEditSubject, trigger: HTMLElement | null) => {
      restoreFocusRef.current = trigger;
      returnItemIdRef.current = next.planItemId;
      scrollYRef.current = window.scrollY;
      setSubject(next);
      setDirty(false);
      setPending(false);
      setOpen(true);
    },
    [],
  );

  const onSuccess = useCallback(() => {
    const y = scrollYRef.current;
    const itemId = returnItemIdRef.current;
    setDirty(false);
    setPending(false);
    setOpen(false);
    setSubject(null);
    const restore = () => {
      window.scrollTo(0, y);
      if (itemId) {
        document
          .querySelector<HTMLElement>(`[data-plan-item-edit="${itemId}"]`)
          ?.focus();
      }
    };
    requestAnimationFrame(restore);
    window.setTimeout(restore, 50);
    window.setTimeout(restore, 250);
  }, []);

  const api = useMemo(() => ({ openEdit }), [openEdit]);

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
        restoreFocusRef={restoreFocusRef}
        onClose={close}
        onSuccess={onSuccess}
        onDirtyChange={setDirty}
        onPendingChange={setPending}
      />
    </PlanItemEditContext.Provider>
  );
}
