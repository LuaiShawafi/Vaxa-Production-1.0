-- Archive duplicate active plans per week (keep newest). Requires ARCHIVED enum from prior migration.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY week ORDER BY created_at DESC) AS rn
  FROM weekly_plans
  WHERE status::text IN ('DRAFT', 'PUBLISHED')
)
UPDATE weekly_plans AS w
SET status = 'ARCHIVED', archived_at = CURRENT_TIMESTAMP
FROM ranked AS r
WHERE w.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX "weekly_plans_one_active_per_week_key" ON "weekly_plans"("week") WHERE "status" IN ('DRAFT', 'PUBLISHED');
