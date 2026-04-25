import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.ts";
import type { TokenPayload } from "./auth.ts";

export type TxClient = Prisma.TransactionClient;

export const LOCK_NAMESPACE = {
  AIP: 10_001,
  PIR: 10_002,
} as const;

export interface AIPLockRecord {
  id: number;
  school_id: number | null;
  created_by_user_id: number | null;
  program_id: number;
  year: number;
}

export interface PIRLockRecord {
  aip_id: number;
  quarter: string;
}

export function normalizeLockPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function aipResourceKey(
  user: TokenPayload,
  schoolId: number | null,
  programId: number,
  year: number,
): string {
  const ownerKey = schoolId != null ? `school:${schoolId}` : `user:${user.id}`;
  return `aip:${ownerKey}:program:${programId}:year:${year}`;
}

export function aipResourceKeyFromRecord(record: AIPLockRecord): string {
  if (record.school_id != null) {
    return `aip:school:${record.school_id}:program:${record.program_id}:year:${record.year}`;
  }
  if (record.created_by_user_id != null) {
    return `aip:user:${record.created_by_user_id}:program:${record.program_id}:year:${record.year}`;
  }
  return `aip:id:${record.id}`;
}

export function pirResourceKey(aipId: number, quarter: string): string {
  return `pir:aip:${aipId}:quarter:${normalizeLockPart(quarter)}`;
}

export function pirResourceKeyFromRecord(record: PIRLockRecord): string {
  return pirResourceKey(record.aip_id, record.quarter);
}

export async function withAdvisoryLock<T>(
  namespace: number,
  resource: string,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  return withAdvisoryLocks([{ namespace, resource }], fn);
}

export async function withAdvisoryLocks<T>(
  locks: Array<{ namespace: number; resource: string }>,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const orderedLocks = [...new Map(
      locks.map((lock) => [`${lock.namespace}:${lock.resource}`, lock]),
    ).values()].sort((a, b) =>
      a.namespace - b.namespace || a.resource.localeCompare(b.resource)
    );
    for (const lock of orderedLocks) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(${lock.namespace}, hashtext(${lock.resource}))
      `;
    }
    return fn(tx);
  });
}
