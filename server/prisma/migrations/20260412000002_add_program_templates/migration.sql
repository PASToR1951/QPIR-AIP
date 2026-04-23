-- Add one-to-one Program templates plus explicit AIP target_description storage.

ALTER TABLE "AIP"
ADD COLUMN "target_description" TEXT NOT NULL DEFAULT '';

CREATE TABLE "program_templates" (
  "id" SERIAL PRIMARY KEY,
  "program_id" INTEGER NOT NULL,
  "outcome" TEXT NOT NULL,
  "target_code" TEXT NOT NULL,
  "target_description" TEXT NOT NULL,
  "indicators" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "program_templates_program_id_key"
ON "program_templates"("program_id");

ALTER TABLE "program_templates"
ADD CONSTRAINT "program_templates_program_id_fkey"
FOREIGN KEY ("program_id") REFERENCES "Program"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
