import { Hono } from "hono";
import { getUserFromToken, type TokenPayload } from "../lib/auth.ts";
import { logger } from "../lib/logger.ts";
import { writeAuditLog } from "./admin/shared/audit.ts";

import type { Context } from "hono";

const backupRoutes = new Hono();

const FALLBACK_BACKUP_BASE_DIR = "/app/backups";
const BACKUP_BASE_DIR_CANDIDATES = [
  FALLBACK_BACKUP_BASE_DIR,
  "../backups",
  "./backups",
];

function joinPath(base: string, child: string) {
  return `${base.replace(/\/+$/, "")}/${child.replace(/^\/+/, "")}`;
}

async function isDirectory(path: string) {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}

async function getBackupBaseDir() {
  const configured = Deno.env.get("BACKUP_BASE_DIR")?.trim();
  if (configured) return configured;

  for (const candidate of BACKUP_BASE_DIR_CANDIDATES) {
    if (await isDirectory(candidate)) return candidate;
  }

  return FALLBACK_BACKUP_BASE_DIR;
}

async function getBackupPaths() {
  const baseDir = await getBackupBaseDir();
  return {
    statusFile: joinPath(baseDir, "status.json"),
    hourlyDir: joinPath(baseDir, "hourly"),
    dailyDir: joinPath(baseDir, "daily"),
    triggerDir: Deno.env.get("BACKUP_TRIGGER_DIR")?.trim() ||
      joinPath(baseDir, "triggers"),
  };
}

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
  const paths = await getBackupPaths();

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
    const raw = await Deno.readTextFile(paths.statusFile);
    statusData = JSON.parse(raw);
  } catch {
    // status.json missing — backup service may not have run yet
    statusData.alert_level = "critical";
    statusData.status = "no_status_file";
  }

  // Also list backup files for the history panel
  const [hourlyFiles, dailyFiles] = await Promise.all([
    listBackupFiles(paths.hourlyDir),
    listBackupFiles(paths.dailyDir),
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
  const paths = await getBackupPaths();

  logger.info("Manual backup triggered", { admin_id: admin.id });

  try {
    await Deno.mkdir(paths.triggerDir, { recursive: true });
    const triggerId = `${Date.now()}-${crypto.randomUUID()}`;
    const triggerPath = joinPath(paths.triggerDir, `hourly-${triggerId}.json`);
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
