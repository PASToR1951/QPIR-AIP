import { buildSubmittedBy } from "../shared/display.ts";

// ── Inline DB result types ─────────────────────────────────────────────────

type ClusterShape = {
  id: number;
  cluster_number: number;
  name: string;
  logo?: string | null;
};

type SchoolShape = {
  id: number;
  name: string;
  logo?: string | null;
  cluster?: ClusterShape;
  users?: UserShape[];
} | null;

type UserShape = {
  role?: string | null;
  name?: string | null;
  first_name?: string | null;
  middle_initial?: string | null;
  last_name?: string | null;
  email?: string;
} | null;

export type RawAIP = {
  id: number;
  public_id: string;
  status: string;
  year: number;
  created_at: Date;
  division?: string | null;
  school?: SchoolShape;
  program: { id: number; title: string };
  created_by?: UserShape;
};

export type RawPIR = {
  id: number;
  public_id: string;
  status: string;
  quarter: string;
  created_at: Date;
  aip: {
    year: number;
    division?: string | null;
    school?: SchoolShape;
    program: { id: number; title: string };
  };
  created_by?: UserShape;
};

// ── Normalizers ────────────────────────────────────────────────────────────

export function normalizeAIP(aip: RawAIP, divisionLogo: string | null = null) {
  const schoolId = aip.school?.id ?? null;
  return {
    id: aip.public_id,
    internalId: aip.id,
    ref: aip.public_id,
    type: "AIP" as const,
    status: aip.status,
    year: aip.year,
    quarter: null,
    schoolId,
    divisionLogo: schoolId ? null : divisionLogo,
    division: aip.division ?? null,
    schoolHead: aip.school?.users?.[0] ? buildSubmittedBy(aip.school.users[0]) : null,
    school: aip.school?.name ?? "Division",
    schoolLogo: aip.school?.logo ?? null,
    cluster: aip.school?.cluster
      ? `Cluster ${aip.school.cluster.cluster_number}`
      : "—",
    clusterId: aip.school?.cluster?.id ?? null,
    clusterNumber: aip.school?.cluster?.cluster_number ?? null,
    clusterLogo: aip.school?.cluster?.logo ?? null,
    program: aip.program.title,
    programId: aip.program.id,
    dateSubmitted: aip.created_at,
    submittedBy: buildSubmittedBy(aip.created_by),
  };
}

export function normalizePIR(pir: RawPIR, divisionLogo: string | null = null) {
  const schoolId = pir.aip.school?.id ?? null;
  return {
    id: pir.public_id,
    internalId: pir.id,
    ref: pir.public_id,
    type: "PIR" as const,
    status: pir.status,
    year: pir.aip.year,
    quarter: pir.quarter,
    schoolId,
    divisionLogo: schoolId ? null : divisionLogo,
    division: pir.aip.division ?? null,
    schoolHead: pir.aip.school?.users?.[0] ? buildSubmittedBy(pir.aip.school.users[0]) : null,
    school: pir.aip.school?.name ?? "Division",
    schoolLogo: pir.aip.school?.logo ?? null,
    cluster: pir.aip.school?.cluster
      ? `Cluster ${pir.aip.school.cluster.cluster_number}`
      : "—",
    clusterId: pir.aip.school?.cluster?.id ?? null,
    clusterNumber: pir.aip.school?.cluster?.cluster_number ?? null,
    clusterLogo: pir.aip.school?.cluster?.logo ?? null,
    program: pir.aip.program.title,
    programId: pir.aip.program.id,
    dateSubmitted: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
  };
}
