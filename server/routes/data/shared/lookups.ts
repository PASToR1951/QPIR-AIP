import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/client.ts";
import type { TokenPayload } from "../../../lib/auth.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";

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
) {
  if ((user.role === "School" || user.role === "Cluster Coordinator") && user.school_id) {
    if (include) {
      return prisma.aIP.findUnique({
        where: {
          school_id_program_id_year: {
            school_id: user.school_id,
            program_id: programId,
            year,
          },
        },
        include,
      });
    }

    return prisma.aIP.findUnique({
      where: {
        school_id_program_id_year: {
          school_id: user.school_id,
          program_id: programId,
          year,
        },
      },
    });
  }

  if (include) {
    return prisma.aIP.findFirst({
      where: {
        created_by_user_id: user.id,
        school_id: null,
        program_id: programId,
        year,
      },
      include,
    });
  }

  return prisma.aIP.findFirst({
    where: {
      created_by_user_id: user.id,
      school_id: null,
      program_id: programId,
      year,
    },
  });
}

export async function fetchPIRForUser(
  aipId: number,
  quarter: string,
  include?: Prisma.PIRInclude,
) {
  if (include) {
    return prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aipId, quarter } },
      include,
    });
  }

  return prisma.pIR.findUnique({
    where: { aip_id_quarter: { aip_id: aipId, quarter } },
  });
}
