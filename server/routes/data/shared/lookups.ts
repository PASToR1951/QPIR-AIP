import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/client.ts";
import type { TokenPayload } from "../../../lib/auth.ts";

export async function fetchProgramByTitle(title: string) {
  return prisma.program.findFirst({ where: { title } });
}

export async function fetchAIPForUser(
  user: TokenPayload,
  programId: number,
  year: number,
  include?: Prisma.AIPInclude,
) {
  if (user.role === "School" && user.school_id) {
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
