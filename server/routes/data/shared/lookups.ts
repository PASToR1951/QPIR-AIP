import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/client.ts";
import type { TxClient } from "../../../lib/advisoryLock.ts";
import type { TokenPayload } from "../../../lib/auth.ts";
import { normalizeQuarterLabel } from "../../../lib/quarters.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";

type DbClient = typeof prisma | TxClient;

export async function fetchProgramByTitle(title: string) {
  return prisma.program.findFirst({
    where: { title },
    orderBy: { id: "asc" },
  });
}

export async function fetchProgramByReference(
  programId: string | number | null | undefined,
  title: string | null | undefined,
) {
  const parsedId = safeParseInt(programId, 0);
  if (parsedId > 0) {
    const programById = await prisma.program.findUnique({
      where: { id: parsedId },
    });
    if (programById) {
      return programById;
    }
  }

  if (!title) {
    return null;
  }

  return fetchProgramByTitle(title);
}

export async function fetchAIPForUser(
  user: TokenPayload,
  programId: number,
  year: number,
  include?: Prisma.AIPInclude,
  db: DbClient = prisma,
) {
  if (user.role === "School" && user.school_id) {
    return db.aIP.findUnique({
      where: {
        school_id_program_id_year: {
          school_id: user.school_id,
          program_id: programId,
          year,
        },
      },
      ...(include ? { include } : {}),
    });
  }

  return db.aIP.findFirst({
    where: {
      created_by_user_id: user.id,
      school_id: null,
      program_id: programId,
      year,
    },
    ...(include ? { include } : {}),
  });
}

export async function fetchPIRForUser(
  aipId: number,
  quarter: string,
  include?: Prisma.PIRInclude,
  db: DbClient = prisma,
) {
  const normalizedQuarter = normalizeQuarterLabel(quarter);
  return db.pIR.findUnique({
    where: { aip_id_quarter: { aip_id: aipId, quarter: normalizedQuarter } },
    ...(include ? { include } : {}),
  });
}
