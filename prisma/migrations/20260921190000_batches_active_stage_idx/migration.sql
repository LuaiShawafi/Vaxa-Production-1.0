-- Active batches read model: filter GERMINATION/NURSERY without scanning
-- historical PLANNED/HARVESTED rows, and support visible_batch_number order.
CREATE INDEX "batches_active_stage_visible_number_idx"
  ON "batches" ("current_stage", "visible_batch_number")
  WHERE "current_stage" IN ('GERMINATION', 'NURSERY');
