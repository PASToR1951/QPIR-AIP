CREATE TABLE "program_focal_persons" (
    "program_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "program_focal_persons_pkey" PRIMARY KEY ("program_id", "user_id")
);

CREATE INDEX "program_focal_persons_user_id_idx" ON "program_focal_persons"("user_id");

ALTER TABLE "program_focal_persons"
ADD CONSTRAINT "program_focal_persons_program_id_fkey"
FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "program_focal_persons"
ADD CONSTRAINT "program_focal_persons_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIP"
ADD COLUMN "focal_person_id" INTEGER,
ADD COLUMN "focal_recommended_at" TIMESTAMP(3),
ADD COLUMN "focal_remarks" TEXT,
ADD COLUMN "ces_reviewer_id" INTEGER,
ADD COLUMN "ces_noted_at" TIMESTAMP(3),
ADD COLUMN "ces_remarks" TEXT;

CREATE INDEX "AIP_status_program_id_focal_person_id_idx" ON "AIP"("status", "program_id", "focal_person_id");
CREATE INDEX "AIP_status_ces_reviewer_id_idx" ON "AIP"("status", "ces_reviewer_id");

ALTER TABLE "AIP"
ADD CONSTRAINT "AIP_focal_person_id_fkey"
FOREIGN KEY ("focal_person_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIP"
ADD CONSTRAINT "AIP_ces_reviewer_id_fkey"
FOREIGN KEY ("ces_reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PIR"
ADD COLUMN "focal_person_id" INTEGER,
ADD COLUMN "focal_recommended_at" TIMESTAMP(3),
ADD COLUMN "focal_remarks" TEXT;

CREATE INDEX "PIR_status_focal_person_id_idx" ON "PIR"("status", "focal_person_id");

ALTER TABLE "PIR"
ADD CONSTRAINT "PIR_focal_person_id_fkey"
FOREIGN KEY ("focal_person_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
