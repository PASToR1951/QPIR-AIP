export type AdminLogSeverity = "info" | "notice" | "warn" | "critical";
export type AdminLogCategory =
  | "auth"
  | "submission"
  | "user"
  | "organization"
  | "system"
  | "export";

export interface ActionCatalogEntry {
  key: string;
  label: string;
  category: AdminLogCategory;
  severity: AdminLogSeverity;
  icon: string;
  color: string;
}

function define(
  key: string,
  label: string,
  category: AdminLogCategory,
  severity: AdminLogSeverity,
  icon: string,
  color: string,
): ActionCatalogEntry {
  return { key, label, category, severity, icon, color };
}

export const ACTION_CATALOG: Record<string, ActionCatalogEntry> = {
  login: define("login", "Logged In", "auth", "info", "SignIn", "emerald"),
  logout: define("logout", "Logged Out", "auth", "info", "SignOut", "slate"),
  failed_login: define(
    "failed_login",
    "Failed Login",
    "auth",
    "critical",
    "WarningCircle",
    "rose",
  ),
  password_change: define(
    "password_change",
    "Changed Password",
    "auth",
    "warn",
    "Key",
    "amber",
  ),
  aip_submit: define(
    "aip_submit",
    "Submitted AIP",
    "submission",
    "notice",
    "PaperPlaneTilt",
    "blue",
  ),
  aip_update: define(
    "aip_update",
    "Updated AIP",
    "submission",
    "notice",
    "PencilSimple",
    "indigo",
  ),
  aip_delete: define(
    "aip_delete",
    "Deleted AIP",
    "submission",
    "critical",
    "Trash",
    "rose",
  ),
  aip_edit_request: define(
    "aip_edit_request",
    "Requested AIP Edit",
    "submission",
    "warn",
    "PencilLine",
    "amber",
  ),
  aip_cancel_edit_request: define(
    "aip_cancel_edit_request",
    "Canceled AIP Edit Request",
    "submission",
    "info",
    "XCircle",
    "slate",
  ),
  approved_aip_edit_request: define(
    "approved_aip_edit_request",
    "Approved AIP Edit Request",
    "submission",
    "notice",
    "CheckCircle",
    "emerald",
  ),
  denied_aip_edit_request: define(
    "denied_aip_edit_request",
    "Denied AIP Edit Request",
    "submission",
    "warn",
    "WarningCircle",
    "amber",
  ),
  updated_aip_status: define(
    "updated_aip_status",
    "Updated AIP Status",
    "submission",
    "notice",
    "ArrowsClockwise",
    "blue",
  ),
  pir_submit: define(
    "pir_submit",
    "Submitted PIR",
    "submission",
    "notice",
    "PaperPlaneTilt",
    "teal",
  ),
  pir_update: define(
    "pir_update",
    "Updated PIR",
    "submission",
    "notice",
    "PencilSimple",
    "cyan",
  ),
  pir_delete: define(
    "pir_delete",
    "Deleted PIR",
    "submission",
    "critical",
    "Trash",
    "rose",
  ),
  updated_pir_status: define(
    "updated_pir_status",
    "Updated PIR Status",
    "submission",
    "notice",
    "ArrowsClockwise",
    "blue",
  ),
  started_pir_review: define(
    "started_pir_review",
    "Started PIR Review",
    "submission",
    "notice",
    "MagnifyingGlass",
    "indigo",
  ),
  ces_noted_pir: define(
    "ces_noted_pir",
    "CES Noted PIR",
    "submission",
    "notice",
    "CheckCircle",
    "emerald",
  ),
  ces_returned_pir: define(
    "ces_returned_pir",
    "CES Returned PIR",
    "submission",
    "warn",
    "ArrowUUpLeft",
    "amber",
  ),
  cluster_head_noted_pir: define(
    "cluster_head_noted_pir",
    "Cluster Head Noted PIR",
    "submission",
    "notice",
    "CheckCircle",
    "emerald",
  ),
  cluster_head_returned_pir: define(
    "cluster_head_returned_pir",
    "Cluster Head Returned PIR",
    "submission",
    "warn",
    "ArrowUUpLeft",
    "amber",
  ),
  read_pir: define(
    "read_pir",
    "Viewed PIR",
    "submission",
    "info",
    "Eye",
    "slate",
  ),
  update_remarks: define(
    "update_remarks",
    "Updated PIR Remarks",
    "submission",
    "notice",
    "NotePencil",
    "indigo",
  ),
  toggle_presented: define(
    "toggle_presented",
    "Toggled PIR Presented",
    "submission",
    "notice",
    "Checks",
    "blue",
  ),
  update_activity_notes: define(
    "update_activity_notes",
    "Updated Activity Notes",
    "submission",
    "notice",
    "NotePencil",
    "indigo",
  ),
  updated_observer_notes: define(
    "updated_observer_notes",
    "Updated Observer Notes",
    "submission",
    "notice",
    "NotePencil",
    "indigo",
  ),
  created_user: define(
    "created_user",
    "Created User",
    "user",
    "notice",
    "UserPlus",
    "emerald",
  ),
  updated_user: define(
    "updated_user",
    "Updated User",
    "user",
    "notice",
    "UserCircleGear",
    "indigo",
  ),
  deleted_user: define(
    "deleted_user",
    "Deleted User",
    "user",
    "critical",
    "UserMinus",
    "rose",
  ),
  anonymized_user: define(
    "anonymized_user",
    "Anonymized User",
    "user",
    "critical",
    "ShieldWarning",
    "rose",
  ),
  reset_password: define(
    "reset_password",
    "Reset Password",
    "user",
    "warn",
    "Key",
    "amber",
  ),
  bulk_imported_users: define(
    "bulk_imported_users",
    "Imported Users",
    "user",
    "notice",
    "UsersThree",
    "blue",
  ),
  viewed_user_pii: define(
    "viewed_user_pii",
    "Viewed User Profile",
    "user",
    "warn",
    "Eye",
    "amber",
  ),
  revoked_session: define(
    "revoked_session",
    "Revoked Session",
    "user",
    "critical",
    "KeyReturn",
    "rose",
  ),
  revoked_user_sessions: define(
    "revoked_user_sessions",
    "Revoked User Sessions",
    "user",
    "critical",
    "KeyReturn",
    "rose",
  ),
  created_school: define(
    "created_school",
    "Created School",
    "organization",
    "notice",
    "Buildings",
    "blue",
  ),
  updated_school: define(
    "updated_school",
    "Updated School",
    "organization",
    "notice",
    "Buildings",
    "indigo",
  ),
  deleted_school: define(
    "deleted_school",
    "Deleted School",
    "organization",
    "critical",
    "Buildings",
    "rose",
  ),
  updated_school_restrictions: define(
    "updated_school_restrictions",
    "Updated School Restrictions",
    "organization",
    "notice",
    "FunnelSimple",
    "blue",
  ),
  uploaded_school_logo: define(
    "uploaded_school_logo",
    "Uploaded School Logo",
    "organization",
    "notice",
    "ImageSquare",
    "blue",
  ),
  removed_school_logo: define(
    "removed_school_logo",
    "Removed School Logo",
    "organization",
    "warn",
    "ImageSquare",
    "amber",
  ),
  created_cluster: define(
    "created_cluster",
    "Created Cluster",
    "organization",
    "notice",
    "SquaresFour",
    "blue",
  ),
  updated_cluster: define(
    "updated_cluster",
    "Updated Cluster",
    "organization",
    "notice",
    "SquaresFour",
    "indigo",
  ),
  deleted_cluster: define(
    "deleted_cluster",
    "Deleted Cluster",
    "organization",
    "critical",
    "SquaresFour",
    "rose",
  ),
  assigned_cluster_head: define(
    "assigned_cluster_head",
    "Assigned Cluster Head",
    "organization",
    "notice",
    "UserCirclePlus",
    "emerald",
  ),
  unassigned_cluster_head: define(
    "unassigned_cluster_head",
    "Unassigned Cluster Head",
    "organization",
    "warn",
    "UserCircleMinus",
    "amber",
  ),
  uploaded_cluster_logo: define(
    "uploaded_cluster_logo",
    "Uploaded Cluster Logo",
    "organization",
    "notice",
    "ImageSquare",
    "blue",
  ),
  removed_cluster_logo: define(
    "removed_cluster_logo",
    "Removed Cluster Logo",
    "organization",
    "warn",
    "ImageSquare",
    "amber",
  ),
  created_program: define(
    "created_program",
    "Created Program",
    "organization",
    "notice",
    "BookOpenText",
    "blue",
  ),
  updated_program: define(
    "updated_program",
    "Updated Program",
    "organization",
    "notice",
    "BookOpenText",
    "indigo",
  ),
  deleted_program: define(
    "deleted_program",
    "Deleted Program",
    "organization",
    "critical",
    "BookOpenText",
    "rose",
  ),
  updated_program_personnel: define(
    "updated_program_personnel",
    "Updated Program Personnel",
    "organization",
    "notice",
    "UsersThree",
    "blue",
  ),
  created_program_template: define(
    "created_program_template",
    "Created Program Template",
    "organization",
    "notice",
    "FileText",
    "blue",
  ),
  updated_program_template: define(
    "updated_program_template",
    "Updated Program Template",
    "organization",
    "notice",
    "FileText",
    "indigo",
  ),
  deleted_program_template: define(
    "deleted_program_template",
    "Deleted Program Template",
    "organization",
    "warn",
    "FileText",
    "amber",
  ),
  changed_deadline: define(
    "changed_deadline",
    "Changed Deadline",
    "system",
    "warn",
    "CalendarSlash",
    "amber",
  ),
  reset_deadline: define(
    "reset_deadline",
    "Reset Deadline",
    "system",
    "warn",
    "CalendarSlash",
    "amber",
  ),
  updated_email_config: define(
    "updated_email_config",
    "Updated Email Config",
    "system",
    "warn",
    "EnvelopeSimple",
    "amber",
  ),
  sent_email_config_test: define(
    "sent_email_config_test",
    "Sent Email Config Test",
    "system",
    "info",
    "EnvelopeSimple",
    "slate",
  ),
  sent_welcome_email_batch: define(
    "sent_welcome_email_batch",
    "Sent Welcome Email Batch",
    "system",
    "notice",
    "EnvelopeSimpleOpen",
    "blue",
  ),
  sent_portal_open_email_blast: define(
    "sent_portal_open_email_blast",
    "Sent Portal Open Email Blast",
    "system",
    "notice",
    "EnvelopeSimpleOpen",
    "blue",
  ),
  updated_division_config: define(
    "updated_division_config",
    "Updated Division Config",
    "system",
    "notice",
    "GearSix",
    "indigo",
  ),
  uploaded_app_logo: define(
    "uploaded_app_logo",
    "Uploaded App Logo",
    "system",
    "notice",
    "ImageSquare",
    "blue",
  ),
  deleted_app_logo: define(
    "deleted_app_logo",
    "Deleted App Logo",
    "system",
    "warn",
    "ImageSquare",
    "amber",
  ),
  BACKUP_TRIGGERED: define(
    "BACKUP_TRIGGERED",
    "Triggered Backup",
    "system",
    "critical",
    "Database",
    "rose",
  ),
  exported_report: define(
    "exported_report",
    "Exported Report",
    "export",
    "notice",
    "DownloadSimple",
    "violet",
  ),
  exported_submissions: define(
    "exported_submissions",
    "Exported Submissions",
    "export",
    "notice",
    "DownloadSimple",
    "violet",
  ),
  exported_admin_logs: define(
    "exported_admin_logs",
    "Exported Admin Logs",
    "export",
    "warn",
    "DownloadSimple",
    "violet",
  ),
  viewed_admin_logs: define(
    "viewed_admin_logs",
    "Viewed Admin Logs",
    "system",
    "info",
    "Eye",
    "slate",
  ),
  data_export: define(
    "data_export",
    "Exported Personal Data",
    "export",
    "warn",
    "DownloadSimple",
    "violet",
  ),
};

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function inferSeverity(action: string): AdminLogSeverity {
  const normalized = action.toLowerCase();
  if (
    normalized === "failed_login" ||
    normalized.includes("deleted") ||
    normalized.includes("anonymized") ||
    normalized.includes("revoked") ||
    normalized.includes("backup_triggered")
  ) {
    return "critical";
  }
  if (
    normalized.includes("returned") ||
    normalized.includes("denied") ||
    normalized.includes("reset") ||
    normalized.includes("changed_deadline") ||
    normalized.includes("updated_email_config") ||
    normalized.includes("exported_admin_logs")
  ) {
    return "warn";
  }
  if (
    normalized.includes("created") ||
    normalized.includes("updated") ||
    normalized.includes("approved") ||
    normalized.includes("submitted") ||
    normalized.includes("started") ||
    normalized.includes("assigned") ||
    normalized.includes("uploaded") ||
    normalized.includes("sent") ||
    normalized.includes("export")
  ) {
    return "notice";
  }
  return "info";
}

function inferCategory(action: string): AdminLogCategory {
  const normalized = action.toLowerCase();
  if (
    normalized.includes("login") ||
    normalized.includes("logout") ||
    normalized.includes("password")
  ) {
    return "auth";
  }
  if (
    normalized.includes("aip") ||
    normalized.includes("pir") ||
    normalized.includes("remarks") ||
    normalized.includes("observer_notes") ||
    normalized.includes("presented")
  ) {
    return "submission";
  }
  if (
    normalized.includes("user") ||
    normalized.includes("session")
  ) {
    return "user";
  }
  if (
    normalized.includes("school") ||
    normalized.includes("cluster") ||
    normalized.includes("program")
  ) {
    return "organization";
  }
  if (normalized.includes("export")) {
    return "export";
  }
  return "system";
}

function inferColor(severity: AdminLogSeverity): string {
  switch (severity) {
    case "critical":
      return "rose";
    case "warn":
      return "amber";
    case "notice":
      return "indigo";
    default:
      return "slate";
  }
}

function inferIcon(action: string, category: AdminLogCategory): string {
  const normalized = action.toLowerCase();
  if (normalized.includes("login")) return "SignIn";
  if (normalized.includes("logout")) return "SignOut";
  if (normalized.includes("password")) return "Key";
  if (normalized.includes("export")) return "DownloadSimple";
  if (normalized.includes("school")) return "Buildings";
  if (normalized.includes("cluster")) return "SquaresFour";
  if (normalized.includes("program")) return "BookOpenText";
  if (normalized.includes("user")) return "UsersThree";
  if (normalized.includes("pir") || normalized.includes("aip")) return "FileText";
  if (normalized.includes("backup")) return "Database";
  if (normalized.includes("email")) return "EnvelopeSimple";
  if (category === "system") return "GearSix";
  return "ClockCounterClockwise";
}

export function getActionMeta(action: string): ActionCatalogEntry {
  const known = ACTION_CATALOG[action];
  if (known) return known;

  const category = inferCategory(action);
  const severity = inferSeverity(action);

  return {
    key: action,
    label: humanizeAction(action),
    category,
    severity,
    icon: inferIcon(action, category),
    color: inferColor(severity),
  };
}

export function listActionCatalog(): ActionCatalogEntry[] {
  return Object.values(ACTION_CATALOG).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function getKnownActionKeys(): string[] {
  return Object.keys(ACTION_CATALOG);
}
