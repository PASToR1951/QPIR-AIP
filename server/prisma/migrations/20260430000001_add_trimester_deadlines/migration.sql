CREATE TABLE IF NOT EXISTS "trimester_deadlines" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "trimester" INTEGER NOT NULL,
    "open_date" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trimester_deadlines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "trimester_deadlines_year_trimester_key"
  ON "trimester_deadlines"("year", "trimester");
