ALTER TABLE "audit_logs"
  ADD COLUMN "ip_address" TEXT;

CREATE INDEX "audit_logs_created_at_idx"
  ON "audit_logs"("created_at" DESC);

CREATE INDEX "audit_logs_action_created_at_idx"
  ON "audit_logs"("action", "created_at" DESC);

CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx"
  ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

CREATE INDEX "audit_logs_admin_id_created_at_idx"
  ON "audit_logs"("admin_id", "created_at" DESC);

CREATE INDEX "user_activity_logs_created_at_idx"
  ON "user_activity_logs"("created_at" DESC);

CREATE INDEX "user_activity_logs_action_created_at_idx"
  ON "user_activity_logs"("action", "created_at" DESC);

CREATE INDEX "user_activity_logs_entity_type_entity_id_created_at_idx"
  ON "user_activity_logs"("entity_type", "entity_id", "created_at" DESC);
