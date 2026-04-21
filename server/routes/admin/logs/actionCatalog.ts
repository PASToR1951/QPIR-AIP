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

type EntryDef = Omit<ActionCatalogEntry, "key">;

const CATALOG: Record<string, EntryDef> = {
  // auth
  login:                        { label: "Logged In",                   category: "auth",         severity: "info",     icon: "SignIn",              color: "emerald" },
  logout:                       { label: "Logged Out",                  category: "auth",         severity: "info",     icon: "SignOut",             color: "slate"   },
  failed_login:                 { label: "Failed Login",                category: "auth",         severity: "critical", icon: "WarningCircle",       color: "rose"    },
  password_change:              { label: "Changed Password",            category: "auth",         severity: "warn",     icon: "Key",                 color: "amber"   },

  // submission — AIP
  aip_submit:                   { label: "Submitted AIP",               category: "submission",   severity: "notice",   icon: "PaperPlaneTilt",      color: "blue"    },
  aip_update:                   { label: "Updated AIP",                 category: "submission",   severity: "notice",   icon: "PencilSimple",        color: "indigo"  },
  aip_delete:                   { label: "Deleted AIP",                 category: "submission",   severity: "critical", icon: "Trash",               color: "rose"    },
  aip_edit_request:             { label: "Requested AIP Edit",          category: "submission",   severity: "warn",     icon: "PencilLine",          color: "amber"   },
  aip_cancel_edit_request:      { label: "Canceled AIP Edit Request",   category: "submission",   severity: "info",     icon: "XCircle",             color: "slate"   },
  approved_aip_edit_request:    { label: "Approved AIP Edit Request",   category: "submission",   severity: "notice",   icon: "CheckCircle",         color: "emerald" },
  denied_aip_edit_request:      { label: "Denied AIP Edit Request",     category: "submission",   severity: "warn",     icon: "WarningCircle",       color: "amber"   },
  updated_aip_status:           { label: "Updated AIP Status",          category: "submission",   severity: "notice",   icon: "ArrowsClockwise",     color: "blue"    },

  // submission — PIR
  pir_submit:                   { label: "Submitted PIR",               category: "submission",   severity: "notice",   icon: "PaperPlaneTilt",      color: "teal"    },
  pir_update:                   { label: "Updated PIR",                 category: "submission",   severity: "notice",   icon: "PencilSimple",        color: "cyan"    },
  pir_delete:                   { label: "Deleted PIR",                 category: "submission",   severity: "critical", icon: "Trash",               color: "rose"    },
  updated_pir_status:           { label: "Updated PIR Status",          category: "submission",   severity: "notice",   icon: "ArrowsClockwise",     color: "blue"    },
  started_pir_review:           { label: "Started PIR Review",          category: "submission",   severity: "notice",   icon: "MagnifyingGlass",     color: "indigo"  },
  ces_noted_pir:                { label: "CES Noted PIR",               category: "submission",   severity: "notice",   icon: "CheckCircle",         color: "emerald" },
  ces_returned_pir:             { label: "CES Returned PIR",            category: "submission",   severity: "warn",     icon: "ArrowUUpLeft",        color: "amber"   },
  cluster_head_noted_pir:       { label: "Cluster Head Noted PIR",      category: "submission",   severity: "notice",   icon: "CheckCircle",         color: "emerald" },
  cluster_head_returned_pir:    { label: "Cluster Head Returned PIR",   category: "submission",   severity: "warn",     icon: "ArrowUUpLeft",        color: "amber"   },
  read_pir:                     { label: "Viewed PIR",                  category: "submission",   severity: "info",     icon: "Eye",                 color: "slate"   },
  update_remarks:               { label: "Updated PIR Remarks",         category: "submission",   severity: "notice",   icon: "NotePencil",          color: "indigo"  },
  toggle_presented:             { label: "Toggled PIR Presented",       category: "submission",   severity: "notice",   icon: "Checks",              color: "blue"    },
  update_activity_notes:        { label: "Updated Activity Notes",      category: "submission",   severity: "notice",   icon: "NotePencil",          color: "indigo"  },
  updated_observer_notes:       { label: "Updated Observer Notes",      category: "submission",   severity: "notice",   icon: "NotePencil",          color: "indigo"  },

  // user
  created_user:                 { label: "Created User",                category: "user",         severity: "notice",   icon: "UserPlus",            color: "emerald" },
  updated_user:                 { label: "Updated User",                category: "user",         severity: "notice",   icon: "UserCircleGear",      color: "indigo"  },
  deleted_user:                 { label: "Deleted User",                category: "user",         severity: "critical", icon: "UserMinus",           color: "rose"    },
  anonymized_user:              { label: "Anonymized User",             category: "user",         severity: "critical", icon: "ShieldWarning",       color: "rose"    },
  reset_password:               { label: "Reset Password",              category: "user",         severity: "warn",     icon: "Key",                 color: "amber"   },
  bulk_imported_users:          { label: "Imported Users",              category: "user",         severity: "notice",   icon: "UsersThree",          color: "blue"    },
  viewed_user_pii:              { label: "Viewed User Profile",         category: "user",         severity: "warn",     icon: "Eye",                 color: "amber"   },
  revoked_session:              { label: "Revoked Session",             category: "user",         severity: "critical", icon: "KeyReturn",           color: "rose"    },
  revoked_user_sessions:        { label: "Revoked User Sessions",       category: "user",         severity: "critical", icon: "KeyReturn",           color: "rose"    },

  // organization — school
  created_school:               { label: "Created School",              category: "organization", severity: "notice",   icon: "Buildings",           color: "blue"    },
  updated_school:               { label: "Updated School",              category: "organization", severity: "notice",   icon: "Buildings",           color: "indigo"  },
  deleted_school:               { label: "Deleted School",              category: "organization", severity: "critical", icon: "Buildings",           color: "rose"    },
  updated_school_restrictions:  { label: "Updated School Restrictions", category: "organization", severity: "notice",   icon: "FunnelSimple",        color: "blue"    },
  uploaded_school_logo:         { label: "Uploaded School Logo",        category: "organization", severity: "notice",   icon: "ImageSquare",         color: "blue"    },
  removed_school_logo:          { label: "Removed School Logo",         category: "organization", severity: "warn",     icon: "ImageSquare",         color: "amber"   },

  // organization — cluster
  created_cluster:              { label: "Created Cluster",             category: "organization", severity: "notice",   icon: "SquaresFour",         color: "blue"    },
  updated_cluster:              { label: "Updated Cluster",             category: "organization", severity: "notice",   icon: "SquaresFour",         color: "indigo"  },
  deleted_cluster:              { label: "Deleted Cluster",             category: "organization", severity: "critical", icon: "SquaresFour",         color: "rose"    },
  assigned_cluster_head:        { label: "Assigned Cluster Head",       category: "organization", severity: "notice",   icon: "UserCirclePlus",      color: "emerald" },
  unassigned_cluster_head:      { label: "Unassigned Cluster Head",     category: "organization", severity: "warn",     icon: "UserCircleMinus",     color: "amber"   },
  uploaded_cluster_logo:        { label: "Uploaded Cluster Logo",       category: "organization", severity: "notice",   icon: "ImageSquare",         color: "blue"    },
  removed_cluster_logo:         { label: "Removed Cluster Logo",        category: "organization", severity: "warn",     icon: "ImageSquare",         color: "amber"   },

  // organization — program
  created_program:              { label: "Created Program",             category: "organization", severity: "notice",   icon: "BookOpenText",        color: "blue"    },
  updated_program:              { label: "Updated Program",             category: "organization", severity: "notice",   icon: "BookOpenText",        color: "indigo"  },
  deleted_program:              { label: "Deleted Program",             category: "organization", severity: "critical", icon: "BookOpenText",        color: "rose"    },
  updated_program_personnel:    { label: "Updated Program Personnel",   category: "organization", severity: "notice",   icon: "UsersThree",          color: "blue"    },
  created_program_template:     { label: "Created Program Template",    category: "organization", severity: "notice",   icon: "FileText",            color: "blue"    },
  updated_program_template:     { label: "Updated Program Template",    category: "organization", severity: "notice",   icon: "FileText",            color: "indigo"  },
  deleted_program_template:     { label: "Deleted Program Template",    category: "organization", severity: "warn",     icon: "FileText",            color: "amber"   },

  // system
  changed_deadline:             { label: "Changed Deadline",            category: "system",       severity: "warn",     icon: "CalendarSlash",       color: "amber"   },
  reset_deadline:               { label: "Reset Deadline",              category: "system",       severity: "warn",     icon: "CalendarSlash",       color: "amber"   },
  updated_email_config:         { label: "Updated Email Config",        category: "system",       severity: "warn",     icon: "EnvelopeSimple",      color: "amber"   },
  sent_email_config_test:       { label: "Sent Email Config Test",      category: "system",       severity: "info",     icon: "EnvelopeSimple",      color: "slate"   },
  sent_welcome_email_batch:     { label: "Sent Welcome Email Batch",    category: "system",       severity: "notice",   icon: "EnvelopeSimpleOpen",  color: "blue"    },
  sent_portal_open_email_blast: { label: "Sent Portal Open Email Blast",category: "system",       severity: "notice",   icon: "EnvelopeSimpleOpen",  color: "blue"    },
  updated_division_config:      { label: "Updated Division Config",     category: "system",       severity: "notice",   icon: "GearSix",             color: "indigo"  },
  uploaded_app_logo:            { label: "Uploaded App Logo",           category: "system",       severity: "notice",   icon: "ImageSquare",         color: "blue"    },
  deleted_app_logo:             { label: "Deleted App Logo",            category: "system",       severity: "warn",     icon: "ImageSquare",         color: "amber"   },
  viewed_admin_logs:            { label: "Viewed Admin Logs",           category: "system",       severity: "info",     icon: "Eye",                 color: "slate"   },
  BACKUP_TRIGGERED:             { label: "Triggered Backup",            category: "system",       severity: "critical", icon: "Database",            color: "rose"    },

  // export
  exported_report:              { label: "Exported Report",             category: "export",       severity: "notice",   icon: "DownloadSimple",      color: "violet"  },
  exported_submissions:         { label: "Exported Submissions",        category: "export",       severity: "notice",   icon: "DownloadSimple",      color: "violet"  },
  exported_admin_logs:          { label: "Exported Admin Logs",         category: "export",       severity: "warn",     icon: "DownloadSimple",      color: "violet"  },
  data_export:                  { label: "Exported Personal Data",      category: "export",       severity: "warn",     icon: "DownloadSimple",      color: "violet"  },
};

export const ACTION_CATALOG: Record<string, ActionCatalogEntry> = Object.fromEntries(
  Object.entries(CATALOG).map(([key, entry]) => [key, { key, ...entry }]),
);

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function inferSeverity(action: string): AdminLogSeverity {
  const n = action.toLowerCase();
  if (
    n === "failed_login" ||
    n.includes("deleted") ||
    n.includes("anonymized") ||
    n.includes("revoked") ||
    n.includes("backup_triggered")
  ) return "critical";
  if (
    n.includes("returned") ||
    n.includes("denied") ||
    n.includes("reset") ||
    n.includes("changed_deadline") ||
    n.includes("updated_email_config") ||
    n.includes("exported_admin_logs")
  ) return "warn";
  if (
    n.includes("created") ||
    n.includes("updated") ||
    n.includes("approved") ||
    n.includes("submitted") ||
    n.includes("started") ||
    n.includes("assigned") ||
    n.includes("uploaded") ||
    n.includes("sent") ||
    n.includes("export")
  ) return "notice";
  return "info";
}

function inferCategory(action: string): AdminLogCategory {
  const n = action.toLowerCase();
  if (n.includes("login") || n.includes("logout") || n.includes("password")) return "auth";
  if (n.includes("aip") || n.includes("pir") || n.includes("remarks") || n.includes("observer_notes") || n.includes("presented")) return "submission";
  if (n.includes("user") || n.includes("session")) return "user";
  if (n.includes("school") || n.includes("cluster") || n.includes("program")) return "organization";
  if (n.includes("export")) return "export";
  return "system";
}

function inferColor(severity: AdminLogSeverity): string {
  switch (severity) {
    case "critical": return "rose";
    case "warn":     return "amber";
    case "notice":   return "indigo";
    default:         return "slate";
  }
}

function inferIcon(action: string, category: AdminLogCategory): string {
  const n = action.toLowerCase();
  if (n.includes("login"))               return "SignIn";
  if (n.includes("logout"))              return "SignOut";
  if (n.includes("password"))            return "Key";
  if (n.includes("export"))             return "DownloadSimple";
  if (n.includes("school"))             return "Buildings";
  if (n.includes("cluster"))            return "SquaresFour";
  if (n.includes("program"))            return "BookOpenText";
  if (n.includes("user"))               return "UsersThree";
  if (n.includes("pir") || n.includes("aip")) return "FileText";
  if (n.includes("backup"))             return "Database";
  if (n.includes("email"))              return "EnvelopeSimple";
  if (category === "system")            return "GearSix";
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
  return Object.values(ACTION_CATALOG).sort((a, b) => a.label.localeCompare(b.label));
}

export function getKnownActionKeys(): string[] {
  return Object.keys(ACTION_CATALOG);
}
