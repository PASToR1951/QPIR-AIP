-- Purge the Cluster Coordinator workflow role.
-- Existing accounts are retained as inactive Pending records to preserve audit
-- and document history, while all pending cluster-head review work returns to CES.

UPDATE "PIR"
SET
  status = 'For CES Review',
  active_reviewer_id = NULL,
  active_review_started_at = NULL
WHERE status = 'For Cluster Head Review';

UPDATE "PIR"
SET
  status = CASE WHEN status = 'Under Review' THEN 'For CES Review' ELSE status END,
  active_reviewer_id = NULL,
  active_review_started_at = NULL
WHERE active_reviewer_id IN (
  SELECT id FROM "User" WHERE role = 'Cluster Coordinator'
);

UPDATE "PIR"
SET ces_reviewer_id = NULL
WHERE ces_reviewer_id IN (
  SELECT id FROM "User" WHERE role = 'Cluster Coordinator'
);

UPDATE "AIP"
SET ces_reviewer_id = NULL
WHERE ces_reviewer_id IN (
  SELECT id FROM "User" WHERE role = 'Cluster Coordinator'
);

UPDATE user_sessions
SET revoked_at = COALESCE(revoked_at, NOW())
WHERE user_id IN (
  SELECT id FROM "User" WHERE role = 'Cluster Coordinator'
);

UPDATE "User"
SET
  role = 'Pending',
  is_active = FALSE,
  school_id = NULL
WHERE role = 'Cluster Coordinator';

ALTER TABLE clusters DROP CONSTRAINT IF EXISTS clusters_cluster_head_id_fkey;
DROP INDEX IF EXISTS clusters_cluster_head_id_key;
ALTER TABLE clusters DROP COLUMN IF EXISTS cluster_head_id;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_cluster_id_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS cluster_id;
