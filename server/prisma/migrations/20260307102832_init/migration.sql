-- CreateTable
CREATE TABLE "Cluster" (
    "id" SERIAL NOT NULL,
    "cluster_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "cluster_id" INTEGER NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "school_level_requirement" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "school_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIP" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pillar" TEXT NOT NULL,
    "sip_title" TEXT NOT NULL,
    "project_coordinator" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "indicators" TEXT NOT NULL,
    "annual_target" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPActivity" (
    "id" SERIAL NOT NULL,
    "aip_id" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "implementation_period" TEXT NOT NULL,
    "persons_involved" TEXT NOT NULL,
    "outputs" TEXT NOT NULL,
    "budget_amount" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "budget_source" TEXT NOT NULL,

    CONSTRAINT "AIPActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PIR" (
    "id" SERIAL NOT NULL,
    "aip_id" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "program_owner" TEXT NOT NULL,
    "total_budget" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "fund_source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PIR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PIRActivityReview" (
    "id" SERIAL NOT NULL,
    "pir_id" INTEGER NOT NULL,
    "aip_activity_id" INTEGER NOT NULL,
    "physical_target" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "financial_target" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "physical_accomplished" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "financial_accomplished" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "actions_to_address_gap" TEXT,

    CONSTRAINT "PIRActivityReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PIRFactor" (
    "id" SERIAL NOT NULL,
    "pir_id" INTEGER NOT NULL,
    "factor_type" TEXT NOT NULL,
    "facilitating_factors" TEXT NOT NULL,
    "hindering_factors" TEXT NOT NULL,

    CONSTRAINT "PIRFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserPrograms" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPrograms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RestrictedPrograms" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RestrictedPrograms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cluster_cluster_number_key" ON "Cluster"("cluster_number");

-- CreateIndex
CREATE UNIQUE INDEX "Program_title_key" ON "Program"("title");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_school_id_key" ON "User"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "AIP_school_id_program_id_year_key" ON "AIP"("school_id", "program_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PIR_aip_id_quarter_key" ON "PIR"("aip_id", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "PIRActivityReview_pir_id_aip_activity_id_key" ON "PIRActivityReview"("pir_id", "aip_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "PIRFactor_pir_id_factor_type_key" ON "PIRFactor"("pir_id", "factor_type");

-- CreateIndex
CREATE INDEX "_UserPrograms_B_index" ON "_UserPrograms"("B");

-- CreateIndex
CREATE INDEX "_RestrictedPrograms_B_index" ON "_RestrictedPrograms"("B");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIP" ADD CONSTRAINT "AIP_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIP" ADD CONSTRAINT "AIP_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPActivity" ADD CONSTRAINT "AIPActivity_aip_id_fkey" FOREIGN KEY ("aip_id") REFERENCES "AIP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIR" ADD CONSTRAINT "PIR_aip_id_fkey" FOREIGN KEY ("aip_id") REFERENCES "AIP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIRActivityReview" ADD CONSTRAINT "PIRActivityReview_pir_id_fkey" FOREIGN KEY ("pir_id") REFERENCES "PIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIRActivityReview" ADD CONSTRAINT "PIRActivityReview_aip_activity_id_fkey" FOREIGN KEY ("aip_activity_id") REFERENCES "AIPActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIRFactor" ADD CONSTRAINT "PIRFactor_pir_id_fkey" FOREIGN KEY ("pir_id") REFERENCES "PIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPrograms" ADD CONSTRAINT "_UserPrograms_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPrograms" ADD CONSTRAINT "_UserPrograms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RestrictedPrograms" ADD CONSTRAINT "_RestrictedPrograms_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RestrictedPrograms" ADD CONSTRAINT "_RestrictedPrograms_B_fkey" FOREIGN KEY ("B") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
