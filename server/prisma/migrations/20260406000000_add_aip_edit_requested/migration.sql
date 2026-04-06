-- AddColumn edit_requested to AIP
ALTER TABLE "AIP" ADD COLUMN "edit_requested" BOOLEAN NOT NULL DEFAULT false;
