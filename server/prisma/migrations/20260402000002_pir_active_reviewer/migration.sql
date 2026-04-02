-- AddColumn: active_reviewer_id and active_review_started_at to PIR
ALTER TABLE "PIR" ADD COLUMN "active_reviewer_id" INTEGER;
ALTER TABLE "PIR" ADD COLUMN "active_review_started_at" TIMESTAMP(3);

ALTER TABLE "PIR" ADD CONSTRAINT "PIR_active_reviewer_id_fkey"
  FOREIGN KEY ("active_reviewer_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
