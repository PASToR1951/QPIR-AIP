import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { prisma } from "../db/client.ts";

type CsvRow = Record<string, string>;
type ImportMode = "visual" | "clean" | "all";
type SourceFilter = "all" | "cluster" | "division";
type NoteMode = "none" | "division" | "all-merge";

type ProgramRecord = {
  id: number;
  title: string;
  abbreviation: string | null;
  division: string | null;
  school_level_requirement: string;
  restricted_schools?: Array<{ id: number }>;
};

type SchoolRecord = {
  id: number;
  name: string;
  abbreviation: string | null;
  level: string;
  cluster_id: number;
};

type Options = {
  apply: boolean;
  replaceDemo: boolean;
  overwriteNotes: boolean;
  includeQuestionable: boolean;
  presented: boolean;
  defaultYear: number;
  csvPath: string;
  mode: ImportMode;
  sourceFilter: SourceFilter;
  importNotes: NoteMode;
  status: string;
};

type ResolvedRow = {
  row: CsvRow;
  program: ProgramRecord;
  school: SchoolRecord | null;
  year: number;
  quarter: number;
};

type ImportGroup = {
  ownerKey: string;
  school: SchoolRecord | null;
  program: ProgramRecord;
  year: number;
  quarter: number;
  rows: ResolvedRow[];
};

type NoteGroup = {
  year: number;
  quarter: number;
  program: ProgramRecord;
  rows: ResolvedRow[];
};

const FACTOR_TYPES = [
  "Institutional",
  "Technical",
  "Infrastructure",
  "Learning Resources",
  "Environmental",
  "Others",
];

const DEMO_USERS = {
  division: {
    email: "pir-demo-division@local",
    role: "Division Personnel",
    name: "PIR Demo Division Personnel",
  },
  schools: {
    "GNHS-P": {
      email: "pir-demo-gnhs-p@local",
      role: "School",
      name: "PIR Demo - GNHS Poblacion",
    },
    "GSCS": {
      email: "pir-demo-gscs@local",
      role: "School",
      name: "PIR Demo - Guihulngan South Central School",
    },
  },
};

const SOURCE_SCHOOL_ALIASES: Record<string, string[]> = {
  "GNHS-P": [
    "GNHS-POBLACION",
    "Guihulngan National High School - Poblacion",
  ],
  "GSCS": ["GSCS", "Guihulngan South Central School"],
};

const PROGRAM_ALIASES: Record<string, string> = {
  "cluster::ALS (For school-based ALS)":
    "school::Alternative Learning System (For school-based ALS)",
  "cluster::IPED": "school::Indigenous Peoples Education",
  "cluster::Alternative Delivery Modality for LDS":
    "school::Alternative Delivery Modality for Learners in Disadvantage Situation",
  "cluster::Education in Emergencies - Alternative Delivery Modality":
    "school::Education in Emergencies (Alternative Delivery Modality)",
  "cluster::Adopt-a-School for LDS":
    "school::Adopt-a-School for Learners in Disadvantage Situation",
  "cluster::CFSS": "school::Child Friendly School System",
  "cluster::DORP": "school::Drop-Out Reduction Program",
  "cluster::Early Registration/Oplan Balik Eskwela":
    "school::Early Registration / Oplan Balik Eskwela",
  "cluster::Programs for SHS: Immersion":
    "school::Programs for Senior High School: Immersion",
  "cluster::SHS Tracking": "school::Senior High School Tracking",
  "cluster::DRRM": "school::Disaster Risk Reduction and Management",
  "cluster::OK sa DepED": "school::OK sa DepED",
  "cluster::Gender and Development (GAD)":
    "school::Gender and Development",
  "cluster::Advocacy, Info Education and Communications Program":
    "school::Advocacy, Information, Education and Communications Program",

  "division_consolidated::ADM/Education in Emergencies":
    "division::CID::ADM- Education in Emergencies",
  "division_consolidated::Special Education (SPEd) Program":
    "division::CID::Special Education Program",
  "division_consolidated::Reading Remediation Program - English":
    "division::CID::Reading Remediation Program",
  "division_consolidated::Reading Remediation Program - Filipino":
    "division::CID::Reading Remediation Program",
  "division_consolidated::EBEIS/LIS":
    "division::SGOD::Enhanced Basic Education Information System / Learner Information System",
  "division_consolidated::Dropout Reduction Program (DORP)":
    "division::SGOD::Dropout Reduction Program",
  "division_consolidated::Youth Leadership Dev't Program":
    "division::SGOD::Youth Leadership Development Program",
  "division_consolidated::Youth Leadership Dev’t Program":
    "division::SGOD::Youth Leadership Development Program",
  "division_consolidated::School-based Management Program":
    "division::SGOD::School-Based Management Program",
  "division_consolidated::School Titling Program":
    "division::OSDS::School Site Titling Program",
  "division_consolidated::PRIME-HRM":
    "division::OSDS::PRIMe- HRM",
  "division_consolidated::Office Communications Management Program":
    "division::OSDS::Office Communication Management Program",
  "division_consolidated::Division ICT Systems and Infrastructure Management Program":
    "division::OSDS::Division ICT System and Infrastructure Management Program",
  "division_consolidated::Advocacy, Info Education, and Communication Program":
    "division::OSDS::Advocacy, Information, and Communication Program",
  "division_consolidated::Gender and Development (GaD)":
    "division::OSDS::Gender and Development",
  "division_consolidated::Mental Health and PsychoSocial Support Program":
    "division::SGOD::Mental Health and Psycho-Social Support Program",
  "division_consolidated::Disaster Risk Reduction and Management (DRRM)":
    "division::SGOD::Disaster Risk Reduction and Management",
  "division_consolidated::Continuous Improvement (CI) Program":
    "division::CID::Continuous Improvement Program",
  "division_consolidated::ISP - Edukasyon sa Pagpakatao (EsP)":
    "division::CID::ISP- Edukasyon sa Pagpapakatao (ESP)",
  "division_consolidated::Learning Outcomes Assessment Program":
    "division::CID::Learning Outcome Assessment Program",
  "division_consolidated::Indigenous People’s Education (IPEd)":
    "division::CID::Indigenous People&#x27;s Education",
};

const QUESTIONABLE_PROGRAM_ALIASES: Record<string, string> = {
  "division_consolidated::Sectarian Affairs Program":
    "division::OSDS::Secretariat Affairs Program",
};

function usage(): string {
  return [
    "Usage:",
    "  deno task import:pir-demo -- --csv /path/to/consolidated_pir_clean.csv --dry-run",
    "  deno task import:pir-demo -- --csv /path/to/consolidated_pir_clean.csv --apply --replace-demo",
    "",
    "Options:",
    "  --apply                  Write records. Without this, the script is dry-run only.",
    "  --dry-run                Explicit dry-run.",
    "  --replace-demo           Delete existing AIPs/PIRs created by demo users for imported years before inserting.",
    "  --csv PATH               Consolidated CSV path. Defaults to the local PIR Sample output when present.",
    "  --mode visual|clean|all  visual=owner+accomplishment percent, clean=visual without flags. Default: visual.",
    "  --source all|cluster|division",
    "  --default-year YEAR      Used when a row has no report_year. Default: 2025.",
    "  --status STATUS          PIR status to seed. Default: Approved.",
    "  --presented=false        Mark school PIRs as not presented. Default: true.",
    "  --import-notes none|division|all-merge. Default: division.",
    "  --overwrite-notes        Update existing consolidation notes. Default: create only / skip existing.",
    "  --include-questionable   Include manually flagged alias mappings.",
    "  --help",
  ].join("\n");
}

function scriptDefaultCsvPath(): string {
  const scriptDir = path.dirname(path.fromFileUrl(import.meta.url));
  return path.resolve(scriptDir, "../../PIR Sample/consolidated_pir_clean.csv");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    apply: false,
    replaceDemo: false,
    overwriteNotes: false,
    includeQuestionable: false,
    presented: true,
    defaultYear: 2025,
    csvPath: scriptDefaultCsvPath(),
    mode: "visual",
    sourceFilter: "all",
    importNotes: "division",
    status: "Approved",
  };

  function requireValue(index: number, name: string): string {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${name} requires a value`);
    }
    return value;
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      Deno.exit(0);
    } else if (arg === "--") {
      continue;
    } else if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--dry-run") {
      options.apply = false;
    } else if (arg === "--replace-demo") {
      options.replaceDemo = true;
    } else if (arg === "--overwrite-notes") {
      options.overwriteNotes = true;
    } else if (arg === "--include-questionable") {
      options.includeQuestionable = true;
    } else if (arg.startsWith("--presented=")) {
      options.presented = arg.split("=")[1]?.toLowerCase() !== "false";
    } else if (arg === "--presented") {
      const value = requireValue(index, "--presented");
      options.presented = value.toLowerCase() !== "false";
      index++;
    } else if (arg.startsWith("--csv=")) {
      options.csvPath = path.resolve(Deno.cwd(), arg.slice("--csv=".length));
    } else if (arg === "--csv") {
      options.csvPath = path.resolve(Deno.cwd(), requireValue(index, "--csv"));
      index++;
    } else if (arg.startsWith("--mode=")) {
      const mode = arg.slice("--mode=".length) as ImportMode;
      if (!["visual", "clean", "all"].includes(mode)) {
        throw new Error(`Invalid --mode: ${mode}`);
      }
      options.mode = mode;
    } else if (arg === "--mode") {
      const mode = requireValue(index, "--mode") as ImportMode;
      if (!["visual", "clean", "all"].includes(mode)) {
        throw new Error(`Invalid --mode: ${mode}`);
      }
      options.mode = mode;
      index++;
    } else if (arg.startsWith("--source=")) {
      const source = arg.slice("--source=".length) as SourceFilter;
      if (!["all", "cluster", "division"].includes(source)) {
        throw new Error(`Invalid --source: ${source}`);
      }
      options.sourceFilter = source;
    } else if (arg === "--source") {
      const source = requireValue(index, "--source") as SourceFilter;
      if (!["all", "cluster", "division"].includes(source)) {
        throw new Error(`Invalid --source: ${source}`);
      }
      options.sourceFilter = source;
      index++;
    } else if (arg.startsWith("--default-year=")) {
      options.defaultYear = parseIntegerOption(arg, "--default-year", 2020, 2100);
    } else if (arg === "--default-year") {
      const value = requireValue(index, "--default-year");
      options.defaultYear = parseIntegerOption(
        `--default-year=${value}`,
        "--default-year",
        2020,
        2100,
      );
      index++;
    } else if (arg.startsWith("--status=")) {
      options.status = arg.slice("--status=".length).trim() || "Approved";
    } else if (arg === "--status") {
      options.status = requireValue(index, "--status").trim() || "Approved";
      index++;
    } else if (arg.startsWith("--import-notes=")) {
      const mode = arg.slice("--import-notes=".length) as NoteMode;
      if (!["none", "division", "all-merge"].includes(mode)) {
        throw new Error(`Invalid --import-notes: ${mode}`);
      }
      options.importNotes = mode;
    } else if (arg === "--import-notes") {
      const mode = requireValue(index, "--import-notes") as NoteMode;
      if (!["none", "division", "all-merge"].includes(mode)) {
        throw new Error(`Invalid --import-notes: ${mode}`);
      }
      options.importNotes = mode;
      index++;
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }

  return options;
}

function parseIntegerOption(
  arg: string,
  name: string,
  min: number,
  max: number,
): number {
  const raw = arg.slice(`${name}=`.length);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("&amp;", "and")
    .replaceAll("&#x27;", "'")
    .replaceAll("’", "'")
    .replaceAll("dev't", "development")
    .replaceAll("dev’t", "development")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function programIndexKey(
  scope: "school" | "division",
  division: string | null,
  name: string,
): string {
  return `${scope}::${scope === "division" ? division ?? "" : ""}::${normalizeName(name)}`;
}

function aliasKey(row: CsvRow): string {
  return `${text(row.source_type)}::${text(row.program)}`;
}

function sourceFilterAllows(row: CsvRow, filter: SourceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "cluster") return text(row.source_type) === "cluster";
  return text(row.source_type) === "division_consolidated";
}

function rowPassesMode(row: CsvRow, mode: ImportMode): boolean {
  if (mode === "all") return true;
  if (text(row.owner_status) !== "reported") return false;
  if (!text(row.accomplishment_percent)) return false;
  if (mode === "clean" && text(row.data_quality_flags)) return false;
  return true;
}

function quarterNumber(raw: string): number | null {
  const match = raw.match(/q\s*([1-4])/i) ?? raw.match(/\b([1-4])\b/);
  if (!match) return null;
  return Number(match[1]);
}

function quarterLabel(quarter: number, year: number): string {
  const ordinals = ["", "1st", "2nd", "3rd", "4th"];
  return `${ordinals[quarter]} Quarter CY ${year}`;
}

function quarterPeriod(quarter: number, year: number) {
  const ranges: Record<number, { start: number; end: number; label: string }> = {
    1: { start: 1, end: 3, label: `Jan-Mar CY ${year}` },
    2: { start: 4, end: 6, label: `Apr-Jun CY ${year}` },
    3: { start: 7, end: 9, label: `Jul-Sep CY ${year}` },
    4: { start: 10, end: 12, label: `Oct-Dec CY ${year}` },
  };
  return ranges[quarter];
}

function numberOrNull(raw: string): number | null {
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function integerOrNull(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function noteFieldsPresent(row: CsvRow): boolean {
  return Boolean(
    text(row.gaps) || text(row.recommendations) || text(row.management_response),
  );
}

function isSchoolProgramEligible(program: ProgramRecord, school: SchoolRecord) {
  const requirement = program.school_level_requirement;
  if (requirement === "Division") return false;
  if (requirement === "Both") return true;
  if (requirement === school.level) return true;
  if (requirement === "Select Schools") {
    const restricted = program.restricted_schools ?? [];
    return !restricted.some((restrictedSchool) => restrictedSchool.id === school.id);
  }
  return false;
}

async function readCsvRows(csvPath: string): Promise<CsvRow[]> {
  try {
    const source = await Deno.readTextFile(csvPath);
    return parse(source, { skipFirstRow: true }) as CsvRow[];
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(
        `CSV not found at ${csvPath}. Pass --csv=/path/to/consolidated_pir_clean.csv.`,
      );
    }
    throw error;
  }
}

function buildProgramIndex(programs: ProgramRecord[]) {
  const index = new Map<string, ProgramRecord>();
  for (const program of programs) {
    const scope = program.school_level_requirement === "Division"
      ? "division"
      : "school";
    index.set(programIndexKey(scope, program.division, program.title), program);
    if (program.abbreviation) {
      index.set(
        programIndexKey(scope, program.division, program.abbreviation),
        program,
      );
    }
  }
  return index;
}

function resolveAliasTarget(
  target: string,
  index: Map<string, ProgramRecord>,
): ProgramRecord | null {
  const parts = target.split("::");
  const [scope] = parts;
  if (scope === "school") {
    const title = parts.slice(1).join("::");
    return index.get(programIndexKey("school", null, title)) ??
      null;
  }
  const maybeDivision = parts[1] ?? "";
  const title = parts.slice(2).join("::");
  return index.get(
    programIndexKey("division", maybeDivision, title),
  ) ?? null;
}

function resolveProgram(
  row: CsvRow,
  index: Map<string, ProgramRecord>,
  options: Options,
): { program: ProgramRecord | null; reason?: string } {
  const key = aliasKey(row);
  const alias = PROGRAM_ALIASES[key];
  if (alias) return { program: resolveAliasTarget(alias, index) };

  const questionableAlias = QUESTIONABLE_PROGRAM_ALIASES[key];
  if (questionableAlias) {
    if (!options.includeQuestionable) {
      return { program: null, reason: "questionable_alias_skipped" };
    }
    return { program: resolveAliasTarget(questionableAlias, index) };
  }

  const isDivision = text(row.source_type) === "division_consolidated";
  const scope = isDivision ? "division" : "school";
  const division = isDivision ? text(row.program_category) : null;
  const direct = index.get(programIndexKey(scope, division, text(row.program)));
  if (direct) return { program: direct };

  return { program: null, reason: "unmapped_program" };
}

function findSchoolForSource(
  sourceUnit: string,
  schools: SchoolRecord[],
): SchoolRecord | null {
  const aliases = SOURCE_SCHOOL_ALIASES[sourceUnit] ?? [];
  for (const alias of aliases) {
    const normalized = normalizeName(alias);
    const match = schools.find((school) =>
      normalizeName(school.abbreviation ?? "") === normalized ||
      normalizeName(school.name) === normalized
    );
    if (match) return match;
  }
  return null;
}

function resolveRows(
  rows: CsvRow[],
  programs: ProgramRecord[],
  schools: SchoolRecord[],
  options: Options,
) {
  const index = buildProgramIndex(programs);
  const schoolCache = new Map<string, SchoolRecord | null>();
  const resolved: ResolvedRow[] = [];
  const noteRows: ResolvedRow[] = [];
  const skipped = new Map<string, number>();
  const examples = new Map<string, string[]>();

  function skip(reason: string, row: CsvRow) {
    skipped.set(reason, (skipped.get(reason) ?? 0) + 1);
    const list = examples.get(reason) ?? [];
    if (list.length < 8) {
      list.push(`${text(row.source_unit)} / ${text(row.program_category)} / ${text(row.program)}`);
      examples.set(reason, list);
    }
  }

  function resolveOne(row: CsvRow, requireMode: boolean): ResolvedRow | null {
    function skipImport(reason: string) {
      if (requireMode) skip(reason, row);
    }

    if (!sourceFilterAllows(row, options.sourceFilter)) {
      skipImport("source_filter");
      return null;
    }
    if (requireMode && !rowPassesMode(row, options.mode)) {
      skip(`mode_${options.mode}`, row);
      return null;
    }

    const quarter = quarterNumber(text(row.report_quarter));
    if (!quarter) {
      skipImport("invalid_quarter");
      return null;
    }
    const year = integerOrNull(text(row.report_year)) ?? options.defaultYear;

    const { program, reason } = resolveProgram(row, index, options);
    if (!program) {
      skipImport(reason ?? "unmapped_program");
      return null;
    }

    let school: SchoolRecord | null = null;
    if (text(row.source_type) === "cluster") {
      const sourceUnit = text(row.source_unit);
      if (!schoolCache.has(sourceUnit)) {
        schoolCache.set(sourceUnit, findSchoolForSource(sourceUnit, schools));
      }
      school = schoolCache.get(sourceUnit) ?? null;
      if (!school) {
        skipImport("unmapped_school_source");
        return null;
      }
      if (!isSchoolProgramEligible(program, school)) {
        skipImport("school_not_eligible_for_program");
        return null;
      }
    }

    return { row, program, school, year, quarter };
  }

  for (const row of rows) {
    const importRow = resolveOne(row, true);
    if (importRow) resolved.push(importRow);

    if (options.importNotes !== "none" && noteFieldsPresent(row)) {
      if (
        options.importNotes === "division" &&
        text(row.source_type) !== "division_consolidated"
      ) {
        continue;
      }
      const noteRow = resolveOne(row, false);
      if (noteRow) noteRows.push(noteRow);
    }
  }

  return { resolved, noteRows, skipped, examples };
}

function buildImportGroups(rows: ResolvedRow[]): ImportGroup[] {
  const groups = new Map<string, ImportGroup>();
  for (const row of rows) {
    const ownerKey = row.school ? `school:${row.school.id}` : "division:demo";
    const key = [
      ownerKey,
      row.year,
      row.quarter,
      row.program.id,
    ].join("|");
    const current = groups.get(key);
    if (current) {
      current.rows.push(row);
    } else {
      groups.set(key, {
        ownerKey,
        school: row.school,
        program: row.program,
        year: row.year,
        quarter: row.quarter,
        rows: [row],
      });
    }
  }
  return [...groups.values()];
}

function buildNoteGroups(rows: ResolvedRow[]): NoteGroup[] {
  const groups = new Map<string, NoteGroup>();
  for (const row of rows) {
    const key = [row.year, row.quarter, row.program.id].join("|");
    const current = groups.get(key);
    if (current) {
      current.rows.push(row);
    } else {
      groups.set(key, {
        year: row.year,
        quarter: row.quarter,
        program: row.program,
        rows: [row],
      });
    }
  }
  return [...groups.values()];
}

function uniqueOwners(rows: ResolvedRow[]) {
  return new Set(
    rows.map((row) => row.school ? text(row.row.source_unit) : "division"),
  );
}

function joinUnique(values: string[]): string {
  return [...new Set(values.map(text).filter(Boolean))].join(" / ");
}

function firstNonEmpty(values: string[], fallback = ""): string {
  return values.map(text).find(Boolean) ?? fallback;
}

function buildAipFields(group: ImportGroup, createdByUserId: number | null) {
  const owner = firstNonEmpty(
    group.rows.map((item) => item.row.program_owner),
    "PIR Demo Import",
  );
  const period = quarterPeriod(group.quarter, group.year);
  const target = firstNonEmpty(
    group.rows.map((item) => item.row.accomplishment_raw),
    "Imported PIR summary",
  );

  return {
    school_id: group.school?.id ?? null,
    program_id: group.program.id,
    created_by_user_id: createdByUserId,
    year: group.year,
    outcome: "PIR Demo Import",
    target_description:
      `Imported ${quarterLabel(group.quarter, group.year)} summary for ${group.program.title}`,
    sip_title: `Demo PIR baseline - ${group.program.title}`,
    project_coordinator: owner,
    objectives: [
      `Demonstrate imported PIR data for ${group.program.title}.`,
    ],
    indicators: [
      {
        description: "Accomplishment of target activities",
        target,
      },
      {
        description: "Technical assistance coverage",
        target: firstNonEmpty(group.rows.map((item) => item.row.ta_raw), ""),
      },
    ],
    kpis: null,
    baseline: null,
    quarterly_target: null,
    prepared_by_name: owner,
    prepared_by_title: "Program Owner",
    approved_by_name: "PIR Demo Import",
    approved_by_title: "Demo Data",
    status: "Approved",
    activities: group.rows.map((item, index) => ({
      phase: "Implementation",
      activity_name: group.rows.length > 1
        ? `${item.row.program} (${index + 1})`
        : item.row.program,
      implementation_period: period.label,
      period_start_month: period.start,
      period_end_month: period.end,
      persons_involved: text(item.row.program_owner) || owner,
      outputs: `Imported summary from ${text(item.row.source_unit)}: ${text(item.row.program)}`,
      budget_amount: 0,
      budget_source: "NONE",
    })),
  };
}

function buildActivityReview(row: CsvRow, aipActivityId: number) {
  const accomplishment = numberOrNull(text(row.accomplishment_percent));
  const ta = numberOrNull(text(row.ta_percent));
  const qualityFlags = text(row.data_quality_flags);
  const gap = text(row.gaps);
  const recommendations = text(row.recommendations);

  return {
    aip_activity_id: aipActivityId,
    complied: accomplishment === null ? null : accomplishment >= 75,
    actual_tasks_conducted:
      `Accomplishment: ${text(row.accomplishment_raw) || "not reported"}`,
    contributory_performance_indicators: [
      accomplishment !== null ? `Accomplishment ${accomplishment}%` : "",
      ta !== null ? `TA ${ta}% (${text(row.ta_raw)})` : text(row.ta_raw),
    ].filter(Boolean).join("; "),
    movs_expected_outputs: `Source CSV: ${text(row.source_file)}`,
    adjustments: qualityFlags
      ? `Data quality flags: ${qualityFlags}`
      : "",
    is_unplanned: false,
    physical_target: accomplishment === null ? 0 : 100,
    financial_target: 0,
    physical_accomplished: accomplishment ?? 0,
    financial_accomplished: 0,
    actions_to_address_gap: recommendations || gap || "",
  };
}

function buildPirFields(
  group: ImportGroup,
  createdByUserId: number | null,
  activityIds: number[],
  options: Options,
) {
  const rows = group.rows.map((item) => item.row);
  const owner = joinUnique(rows.map((row) => row.program_owner)) ||
    "PIR Demo Import";
  const recommendations = rows
    .filter((row) => text(row.recommendations) || text(row.management_response))
    .map((row) => ({
      action: text(row.recommendations) ||
        `Review gap for ${text(row.program)}`,
      response_asds: "",
      response_sds: text(row.management_response),
      source: `${text(row.source_unit)} / ${text(row.program)}`,
    }));

  const indicatorTargets = rows.map((row) => ({
    description: text(row.program),
    annual_target: text(row.accomplishment_raw),
    quarterly_target: text(row.accomplishment_percent)
      ? `${text(row.accomplishment_percent)}%`
      : text(row.accomplishment_raw),
  }));

  const factorText = rows.map((row) =>
    [
      `${text(row.source_unit)} / ${text(row.program)}`,
      text(row.gaps) ? `Gap: ${text(row.gaps)}` : "",
      text(row.recommendations)
        ? `Recommendation: ${text(row.recommendations)}`
        : "",
      text(row.management_response)
        ? `Management response: ${text(row.management_response)}`
        : "",
    ].filter(Boolean).join("\n")
  ).filter(Boolean).join("\n\n");

  return {
    aip_id: 0,
    created_by_user_id: createdByUserId,
    quarter: quarterLabel(group.quarter, group.year),
    program_owner: owner,
    budget_from_division: 0,
    budget_from_co_psf: 0,
    functional_division: group.school ? null : group.program.division,
    indicator_quarterly_targets: indicatorTargets,
    action_items: recommendations,
    status: options.status,
    presented: group.school ? options.presented : false,
    activity_reviews: rows.map((row, index) =>
      buildActivityReview(row, activityIds[index])
    ),
    factors: FACTOR_TYPES.map((type) => ({
      factor_type: type,
      facilitating_factors: type === "Institutional"
        ? `Imported from ${joinUnique(rows.map((row) => row.source_unit))}.`
        : "",
      hindering_factors: type === "Technical" ? factorText : "",
      recommendations: type === "Technical"
        ? joinUnique(rows.map((row) => row.recommendations))
        : "",
    })),
  };
}

function noteValue(rows: ResolvedRow[], field: keyof CsvRow): string {
  const values = rows
    .map((item) => ({
      source: `${text(item.row.source_unit)} / ${text(item.row.program)}`,
      value: text(item.row[field]),
    }))
    .filter((item) => item.value);

  if (values.length === 0) return "";
  if (values.length === 1) return values[0].value;
  return values.map((item) => `[${item.source}] ${item.value}`).join("\n\n");
}

async function ensureDemoUsers(
  tx: any,
  groups: ImportGroup[],
  divisionPrograms: ProgramRecord[],
) {
  const schoolUnits = uniqueOwners(groups.flatMap((group) => group.rows));
  const users = new Map<string, number>();

  if (schoolUnits.has("division")) {
    const user = await tx.user.upsert({
      where: { email: DEMO_USERS.division.email },
      update: {
        role: DEMO_USERS.division.role,
        name: DEMO_USERS.division.name,
        school_id: null,
        cluster_id: null,
        is_active: true,
      },
      create: {
        email: DEMO_USERS.division.email,
        role: DEMO_USERS.division.role,
        name: DEMO_USERS.division.name,
        is_active: true,
      },
    });
    users.set("division", user.id);
    const ids = [...new Set(divisionPrograms.map((program) => program.id))];
    if (ids.length) {
      await tx.user.update({
        where: { id: user.id },
        data: { programs: { connect: ids.map((id) => ({ id })) } },
      });
    }
  }

  for (const [sourceUnit, config] of Object.entries(DEMO_USERS.schools)) {
    if (!schoolUnits.has(sourceUnit)) continue;
    const group = groups.find((item) => text(item.rows[0].row.source_unit) === sourceUnit);
    const school = group?.school;
    if (!school) continue;

    const user = await tx.user.upsert({
      where: { email: config.email },
      update: {
        role: config.role,
        name: config.name,
        school_id: school.id,
        cluster_id: school.cluster_id,
        is_active: true,
      },
      create: {
        email: config.email,
        role: config.role,
        name: config.name,
        school_id: school.id,
        cluster_id: school.cluster_id,
        is_active: true,
      },
    });
    users.set(sourceUnit, user.id);
  }

  return users;
}

async function getDemoUserIds(tx = prisma) {
  const emails = [
    DEMO_USERS.division.email,
    ...Object.values(DEMO_USERS.schools).map((item) => item.email),
  ];
  const users = await tx.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  return new Map(users.map((user: { id: number; email: string }) => [
    user.email,
    user.id,
  ]));
}

async function existingAipForGroup(
  tx: any,
  group: ImportGroup,
  userIds: Map<string, number>,
) {
  if (group.school) {
    return tx.aIP.findUnique({
      where: {
        school_id_program_id_year: {
          school_id: group.school.id,
          program_id: group.program.id,
          year: group.year,
        },
      },
      select: { id: true, created_by_user_id: true },
    });
  }

  const userId = userIds.get(DEMO_USERS.division.email);
  if (!userId) return null;
  return tx.aIP.findFirst({
    where: {
      school_id: null,
      created_by_user_id: userId,
      program_id: group.program.id,
      year: group.year,
    },
    select: { id: true, created_by_user_id: true },
  });
}

function isDemoAip(
  aip: { created_by_user_id: number | null } | null,
  demoUserIds: Map<string, number>,
) {
  if (!aip?.created_by_user_id) return false;
  return [...demoUserIds.values()].includes(aip.created_by_user_id);
}

async function analyzeExistingRecords(
  groups: ImportGroup[],
  options: Options,
) {
  const demoUserIds = await getDemoUserIds();
  let existingDemo = 0;
  let realConflicts = 0;
  let creatable = 0;

  for (const group of groups) {
    const existing = await existingAipForGroup(prisma, group, demoUserIds);
    if (!existing) {
      creatable++;
    } else if (isDemoAip(existing, demoUserIds)) {
      if (options.replaceDemo) creatable++;
      else existingDemo++;
    } else {
      realConflicts++;
    }
  }

  return { existingDemo, realConflicts, creatable };
}

async function importGroups(
  tx: any,
  groups: ImportGroup[],
  options: Options,
  userIds: Map<string, number>,
) {
  const counts = {
    aips: 0,
    pirs: 0,
    activities: 0,
    reviews: 0,
    factors: 0,
    skippedExistingDemo: 0,
    skippedRealConflict: 0,
  };

  for (const group of groups) {
    const existing = await existingAipForGroup(tx, group, userIds);
    if (existing) {
      if (isDemoAip(existing, userIds)) counts.skippedExistingDemo++;
      else counts.skippedRealConflict++;
      continue;
    }

    const sourceUnit = group.school ? text(group.rows[0].row.source_unit) : "division";
    const createdByUserId = userIds.get(sourceUnit) ?? null;
    const aipFields = buildAipFields(group, createdByUserId);
    const activityFields = aipFields.activities;

    const aip = await tx.aIP.create({
      data: {
        ...aipFields,
        activities: undefined,
      },
    });

    const activityIds: number[] = [];
    for (const activity of activityFields) {
      const created = await tx.aIPActivity.create({
        data: { ...activity, aip_id: aip.id },
      });
      activityIds.push(created.id);
    }

    const pirFields = buildPirFields(group, createdByUserId, activityIds, options);
    const pir = await tx.pIR.create({
      data: {
        aip_id: aip.id,
        created_by_user_id: pirFields.created_by_user_id,
        quarter: pirFields.quarter,
        program_owner: pirFields.program_owner,
        budget_from_division: pirFields.budget_from_division,
        budget_from_co_psf: pirFields.budget_from_co_psf,
        functional_division: pirFields.functional_division,
        indicator_quarterly_targets: pirFields.indicator_quarterly_targets,
        action_items: pirFields.action_items,
        status: pirFields.status,
        presented: pirFields.presented,
        activity_reviews: { create: pirFields.activity_reviews },
        factors: { create: pirFields.factors },
      },
    });

    counts.aips++;
    counts.pirs++;
    counts.activities += activityFields.length;
    counts.reviews += pirFields.activity_reviews.length;
    counts.factors += pirFields.factors.length;
    void pir;
  }

  return counts;
}

async function importNotes(
  tx: any,
  noteGroups: NoteGroup[],
  options: Options,
) {
  const counts = { created: 0, updated: 0, skippedExisting: 0 };

  for (const group of noteGroups) {
    const payload = {
      gaps: noteValue(group.rows, "gaps"),
      recommendations: noteValue(group.rows, "recommendations"),
      management_response: noteValue(group.rows, "management_response"),
    };

    const existing = await tx.consolidationNote.findUnique({
      where: {
        year_quarter_program_id: {
          year: group.year,
          quarter: group.quarter,
          program_id: group.program.id,
        },
      },
    });

    if (existing && !options.overwriteNotes) {
      counts.skippedExisting++;
      continue;
    }

    await tx.consolidationNote.upsert({
      where: {
        year_quarter_program_id: {
          year: group.year,
          quarter: group.quarter,
          program_id: group.program.id,
        },
      },
      update: payload,
      create: {
        year: group.year,
        quarter: group.quarter,
        program_id: group.program.id,
        ...payload,
      },
    });

    if (existing) counts.updated++;
    else counts.created++;
  }

  return counts;
}

async function deleteExistingDemoRecords(tx: any, years: number[]) {
  const userIds = await getDemoUserIds(tx);
  const ids = [...userIds.values()];
  if (ids.length === 0) return 0;
  const result = await tx.aIP.deleteMany({
    where: {
      created_by_user_id: { in: ids },
      year: { in: years },
    },
  });
  return result.count;
}

function printSkipped(
  skipped: Map<string, number>,
  examples: Map<string, string[]>,
) {
  if (skipped.size === 0) return;
  console.log("\nSkipped source rows:");
  for (const [reason, count] of [...skipped.entries()].sort()) {
    console.log(`  ${reason}: ${count}`);
    for (const example of examples.get(reason) ?? []) {
      console.log(`    - ${example}`);
    }
  }
}

async function main() {
  const options = parseArgs(Deno.args);
  const csvRows = await readCsvRows(options.csvPath);
  const [programs, schools] = await Promise.all([
    prisma.program.findMany({
      include: { restricted_schools: { select: { id: true } } },
      orderBy: { id: "asc" },
    }) as Promise<ProgramRecord[]>,
    prisma.school.findMany({ orderBy: { id: "asc" } }) as Promise<
      SchoolRecord[]
    >,
  ]);

  const { resolved, noteRows, skipped, examples } = resolveRows(
    csvRows,
    programs,
    schools,
    options,
  );
  const groups = buildImportGroups(resolved);
  const noteGroups = buildNoteGroups(noteRows);
  const existing = await analyzeExistingRecords(groups, options);
  const years = [...new Set(groups.map((group) => group.year))].sort();
  const divisionPrograms = [
    ...new Map(
      groups
        .filter((group) => !group.school)
        .map((group) => [group.program.id, group.program]),
    ).values(),
  ];

  console.log("PIR demo import plan");
  console.log(`  Mode: ${options.mode}`);
  console.log(`  Apply: ${options.apply ? "yes" : "no (dry-run)"}`);
  console.log(`  CSV: ${options.csvPath}`);
  console.log(`  Source rows: ${csvRows.length}`);
  console.log(`  Rows selected for PIR import: ${resolved.length}`);
  console.log(`  AIP/PIR groups to create: ${groups.length}`);
  console.log(`  Activity reviews to create: ${resolved.length}`);
  console.log(`  Consolidation note groups: ${noteGroups.length} (${options.importNotes})`);
  console.log(`  Years: ${years.join(", ") || "none"}`);
  console.log(`  Creatable groups: ${existing.creatable}`);
  console.log(`  Existing demo groups: ${existing.existingDemo}`);
  console.log(`  Real-data conflicts: ${existing.realConflicts}`);
  printSkipped(skipped, examples);

  if (!options.apply) {
    console.log("\nDry-run complete. Re-run with --apply to write records.");
    return;
  }

  const result = await prisma.$transaction(async (tx: any) => {
    let deletedDemoAips = 0;
    if (options.replaceDemo) {
      deletedDemoAips = await deleteExistingDemoRecords(tx, years);
    }

    const userIds = await ensureDemoUsers(tx, groups, divisionPrograms);
    const importCounts = await importGroups(tx, groups, options, userIds);
    const noteCounts = options.importNotes === "none"
      ? { created: 0, updated: 0, skippedExisting: 0 }
      : await importNotes(tx, noteGroups, options);

    return { deletedDemoAips, importCounts, noteCounts };
  });

  console.log("\nImport complete.");
  console.log(`  Deleted demo AIPs: ${result.deletedDemoAips}`);
  console.log(`  AIPs created: ${result.importCounts.aips}`);
  console.log(`  PIRs created: ${result.importCounts.pirs}`);
  console.log(`  AIP activities created: ${result.importCounts.activities}`);
  console.log(`  PIR activity reviews created: ${result.importCounts.reviews}`);
  console.log(`  PIR factors created: ${result.importCounts.factors}`);
  console.log(`  Existing demo groups skipped: ${result.importCounts.skippedExistingDemo}`);
  console.log(`  Real-data conflict groups skipped: ${result.importCounts.skippedRealConflict}`);
  console.log(`  Consolidation notes created: ${result.noteCounts.created}`);
  console.log(`  Consolidation notes updated: ${result.noteCounts.updated}`);
  console.log(`  Consolidation notes skipped existing: ${result.noteCounts.skippedExisting}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    Deno.exit(0);
  })
  .catch(async (error) => {
    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
      const details = error as Error & {
        code?: string;
        clientVersion?: string;
        meta?: unknown;
      };
      if (details.code || details.clientVersion || details.meta) {
        console.error("Error details:", JSON.stringify({
          name: error.name,
          code: details.code,
          clientVersion: details.clientVersion,
          meta: details.meta,
          message: error.message,
        }, null, 2));
      }
    } else {
      console.error(error);
    }
    await prisma.$disconnect();
    Deno.exit(1);
  });
