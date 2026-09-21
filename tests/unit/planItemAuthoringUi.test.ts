import { describe, expect, it } from "vitest";
import {
  PLAN_ITEM_DESTINATION_HINT_DRAFT,
  PLAN_ITEM_DESTINATION_HINT_PUBLISHED_OPEN,
  PLAN_ITEM_DISCARD_CONFIRM_COPY,
  planItemDeleteConfirmMessage,
  planItemDestinationFieldHint,
  planItemDrawerCloseIntent,
  planItemRowActionName,
} from "@/lib/planning/planItemAuthoringUi";

describe("planItemDrawerCloseIntent", () => {
  it("blocks close while a save is pending", () => {
    expect(
      planItemDrawerCloseIntent({
        pending: true,
        dirty: true,
        discardPromptOpen: false,
      }),
    ).toBe("ignore");
    expect(
      planItemDrawerCloseIntent({
        pending: true,
        dirty: false,
        discardPromptOpen: false,
      }),
    ).toBe("ignore");
  });

  it("closes a clean drawer without prompting", () => {
    expect(
      planItemDrawerCloseIntent({
        pending: false,
        dirty: false,
        discardPromptOpen: false,
      }),
    ).toBe("close");
  });

  it("prompts once when dirty, then ignores further close attempts", () => {
    expect(
      planItemDrawerCloseIntent({
        pending: false,
        dirty: true,
        discardPromptOpen: false,
      }),
    ).toBe("prompt-discard");
    expect(
      planItemDrawerCloseIntent({
        pending: false,
        dirty: true,
        discardPromptOpen: true,
      }),
    ).toBe("ignore");
  });
});

describe("plan item delete confirm copy", () => {
  it("uses draft-line copy when there is no materialized batch", () => {
    expect(
      planItemDeleteConfirmMessage({
        uiState: "draft",
        hasMaterializedBatch: false,
      }),
    ).toBe("Remove this draft planning line?");
  });

  it("warns about the batch subtree for published open items", () => {
    const openCopy = planItemDeleteConfirmMessage({
      uiState: "open",
      hasMaterializedBatch: true,
    });
    const openWithoutBatchCopy = planItemDeleteConfirmMessage({
      uiState: "open",
      hasMaterializedBatch: false,
    });
    const draftWithBatchCopy = planItemDeleteConfirmMessage({
      uiState: "draft",
      hasMaterializedBatch: true,
    });
    expect(openCopy).toMatch(/associated batch/);
    expect(openWithoutBatchCopy).toBe(openCopy);
    expect(draftWithBatchCopy).toBe(openCopy);
    expect(openCopy).not.toBe(
      planItemDeleteConfirmMessage({
        uiState: "draft",
        hasMaterializedBatch: false,
      }),
    );
  });
});

describe("plan item destination field hints", () => {
  it("uses draft copy before publish and published-open copy after", () => {
    expect(planItemDestinationFieldHint(false)).toBe(
      PLAN_ITEM_DESTINATION_HINT_DRAFT,
    );
    expect(planItemDestinationFieldHint(true)).toBe(
      PLAN_ITEM_DESTINATION_HINT_PUBLISHED_OPEN,
    );
    expect(PLAN_ITEM_DESTINATION_HINT_DRAFT).toMatch(/created at publish/);
    expect(PLAN_ITEM_DESTINATION_HINT_PUBLISHED_OPEN).toMatch(
      /fixed at publish/,
    );
  });
});

describe("plan item row action names", () => {
  it("names Edit and Delete with SKU and weekday", () => {
    expect(planItemRowActionName("edit", "PU_RED_RADISH", "WEDNESDAY")).toBe(
      "Edit PU_RED_RADISH on WEDNESDAY",
    );
    expect(planItemRowActionName("delete", "PU_RED_RADISH", "WEDNESDAY")).toBe(
      "Delete PU_RED_RADISH on WEDNESDAY",
    );
  });

  it("keeps discard copy short", () => {
    expect(PLAN_ITEM_DISCARD_CONFIRM_COPY).toBe("Discard changes?");
  });
});
