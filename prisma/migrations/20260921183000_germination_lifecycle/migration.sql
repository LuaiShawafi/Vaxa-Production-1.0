-- AlterEnum (must commit before partial index references new values)
ALTER TYPE "ProductionEventType" ADD VALUE 'MOVED_TO_NURSERY';
ALTER TYPE "ProductionEventType" ADD VALUE 'GERMINATION_EXTENDED';
