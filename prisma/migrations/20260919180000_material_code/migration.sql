ALTER TABLE "materials" ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code") WHERE "code" IS NOT NULL;
