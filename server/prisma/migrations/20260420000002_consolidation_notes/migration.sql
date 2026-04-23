-- CreateTable
CREATE TABLE "consolidation_notes" (
    "id"                  SERIAL NOT NULL,
    "year"                INTEGER NOT NULL,
    "quarter"             INTEGER NOT NULL,
    "program_id"          INTEGER NOT NULL,
    "ta_schools_pct"      TEXT,
    "gaps"                TEXT,
    "recommendations"     TEXT,
    "management_response" TEXT,
    "updated_at"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consolidation_notes_year_quarter_program_id_key"
    ON "consolidation_notes"("year", "quarter", "program_id");

-- AddForeignKey
ALTER TABLE "consolidation_notes" ADD CONSTRAINT "consolidation_notes_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "Program"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
