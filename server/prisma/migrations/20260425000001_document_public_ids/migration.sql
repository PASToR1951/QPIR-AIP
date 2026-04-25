-- Add opaque document references for URL/API use while keeping numeric IDs internal.
ALTER TABLE "AIP" ADD COLUMN "public_id" TEXT;
ALTER TABLE "PIR" ADD COLUMN "public_id" TEXT;

UPDATE "AIP"
SET "public_id" = 'aip_' || substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 24)
WHERE "public_id" IS NULL;

UPDATE "PIR"
SET "public_id" = 'pir_' || substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 24)
WHERE "public_id" IS NULL;

ALTER TABLE "AIP" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "PIR" ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX "AIP_public_id_key" ON "AIP"("public_id");
CREATE UNIQUE INDEX "PIR_public_id_key" ON "PIR"("public_id");
