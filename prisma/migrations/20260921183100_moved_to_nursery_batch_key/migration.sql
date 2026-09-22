-- CreateIndex
CREATE UNIQUE INDEX "production_events_moved_to_nursery_batch_key" ON "production_events"("batch_id") WHERE "event_type" = 'MOVED_TO_NURSERY';
