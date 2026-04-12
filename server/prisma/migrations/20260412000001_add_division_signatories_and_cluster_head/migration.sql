-- AlterTable: Add division-specific "Noted by" signatory fields to division_config
ALTER TABLE "division_config" ADD COLUMN "sgod_noted_by_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "division_config" ADD COLUMN "sgod_noted_by_title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "division_config" ADD COLUMN "cid_noted_by_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "division_config" ADD COLUMN "cid_noted_by_title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "division_config" ADD COLUMN "osds_noted_by_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "division_config" ADD COLUMN "osds_noted_by_title" TEXT NOT NULL DEFAULT '';

-- AlterTable: Add cluster head assignment to clusters
ALTER TABLE "clusters" ADD COLUMN "cluster_head_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "clusters_cluster_head_id_key" ON "clusters"("cluster_head_id");

-- AddForeignKey
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_cluster_head_id_fkey" FOREIGN KEY ("cluster_head_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
