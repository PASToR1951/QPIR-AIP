-- Add cluster_id to User for Cluster Coordinator role assignment
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cluster_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_cluster_id_fkey'
      AND conrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_cluster_id_fkey"
      FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
