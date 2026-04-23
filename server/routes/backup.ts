import { Hono } from "hono";
import { getUserFromToken, TokenPayload } from "../lib/auth.ts";
import { logger } from "../lib/logger.ts";
import { writeAuditLog } from "./admin/shared/audit.ts";

import type { Context } from "hono";

const backupRoutes = new Hono();

const STATUS_FILE = "/app/backups/status.json";
const HOURLY_DIR = "/app/backups/hourly";
const DAILY_DIR  = "/app/backups/daily";
const TRIGGER_DIR = Deno.env.get("BACKUP_TRIGGER_DIR") || "/app/backups/triggers";

async function requireAdmin(c: Context): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Admin") return null;
  return user;
}

// List .enc files in a directory, returning name, size, modified time
async function listBackupFiles(dir: string): Promise<Array<{ name: string; size: number; modified: string }>> {
  const files: Array<{ name: string; size: number; modified: string }> = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile || !entry.name.endsWith(".enc") || entry.name.endsWith(".sha256")) continue;
      try {
        const stat = await Deno.stat(`${dir}/${entry.name}`);
        files.push({
          name: entry.name,
          size: stat.size,
          modified: stat.mtime?.toISOString() ?? "",
        });
      } catch { /* skip unreadable files */ }
    }
  } catch { /* directory may not exist yet */ }
  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}

// GET /admin/backup/status
// Returns the contents of status.json plus a listing of backup files.
backupRoutes.get("/status", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  let statusData: Record<string, unknown> = {
    status: "unknown",
    alert_level: "critical",
    last_hourly_backup: null,
    last_daily_backup: null,
    hourly_count: 0,
    daily_count: 0,
    cloud_sync_status: "disabled",
    updated_at: null,
  };

  // Read status.json written by backup_healthcheck.sh
  try {
    const raw = await Deno.readTextFile(STATUS_FILE);
    statusData = JSON.parse(raw);
  } catch {
    // status.json missing — backup service may not have run yet
    statusData.alert_level = "critical";
    statusData.status = "no_status_file";
  }

  // Also list backup files for the history panel
  const [hourlyFiles, dailyFiles] = await Promise.all([
    listBackupFiles(HOURLY_DIR),
    listBackupFiles(DAILY_DIR),
  ]);

  return c.json({
    ...statusData,
    hourly_files: hourlyFiles,
    daily_files: dailyFiles,
  });
});

// POST /admin/backup/trigger
// Queues a manual hourly backup for the backup service to process.
backupRoutes.post("/trigger", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  logger.info("Manual backup triggered", { admin_id: admin.id });

  try {
    await Deno.mkdir(TRIGGER_DIR, { recursive: true });
    const triggerId = `${Date.now()}-${crypto.randomUUID()}`;
    const triggerPath = `${TRIGGER_DIR}/hourly-${triggerId}.json`;
    await Deno.writeTextFile(triggerPath, JSON.stringify({
      type: "hourly",
      triggered_by: admin.id,
      at: new Date().toISOString(),
    }, null, 2));
  } catch (e) {
    logger.error("Manual backup queue failed", e instanceof Error ? e : new Error(String(e)));
    return c.json({ error: "Failed to queue backup request. Check that the backup volume is writable." }, 500);
  }

  // Write audit log
  try {
    await writeAuditLog(admin.id, "BACKUP_TRIGGERED", "backup", 0, {
      triggered_by: admin.id,
      at: new Date().toISOString(),
    }, { ctx: c });
  } catch (e) {
    logger.warn("Failed to write audit log for backup trigger", { error: String(e) });
  }

  return c.json({ triggered: true, message: "Backup queued. Check /admin/backup/status for progress." });
});

export default backupRoutes;
