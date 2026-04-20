import { prisma } from "../../../db/client.ts";
import { buildSubmittedBy } from "../shared/display.ts";
import { getEntityLookupKey, type RawAdminLogRow, toNullableNumber } from "./shared.ts";

function addIds(
  map: Map<string, Set<number>>,
  type: string | null,
  id: bigint | number | string | null,
) {
  const numericId = toNullableNumber(id);
  if (!type || numericId === null || numericId === 0) return;
  if (!map.has(type)) map.set(type, new Set());
  map.get(type)!.add(numericId);
}

export async function resolveEntityLabels(
  rows: RawAdminLogRow[],
): Promise<Map<string, string>> {
  const idsByType = new Map<string, Set<number>>();
  for (const row of rows) {
    addIds(idsByType, row.entity_type, row.entity_id);
  }

  const labels = new Map<string, string>();

  const aipIds = [...(idsByType.get("AIP") ?? [])];
  if (aipIds.length) {
    const aips = await prisma.aIP.findMany({
      where: { id: { in: aipIds } },
      select: {
        id: true,
        year: true,
        program: { select: { title: true } },
        school: { select: { name: true } },
      },
    });
    for (const aip of aips) {
      labels.set(
        getEntityLookupKey("AIP", aip.id)!,
        `${aip.school?.name ?? "Division"} — ${aip.program.title} (${aip.year})`,
      );
    }
  }

  const pirIds = [...(idsByType.get("PIR") ?? [])];
  if (pirIds.length) {
    const pirs = await prisma.pIR.findMany({
      where: { id: { in: pirIds } },
      select: {
        id: true,
        quarter: true,
        aip: {
          select: {
            year: true,
            program: { select: { title: true } },
            school: { select: { name: true } },
          },
        },
      },
    });
    for (const pir of pirs) {
      labels.set(
        getEntityLookupKey("PIR", pir.id)!,
        `${pir.aip.school?.name ?? "Division"} — ${pir.aip.program.title} (${pir.quarter}, ${pir.aip.year})`,
      );
    }
  }

  const userIds = [...(idsByType.get("User") ?? [])];
  if (userIds.length) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        first_name: true,
        middle_initial: true,
        last_name: true,
      },
    });
    for (const user of users) {
      labels.set(
        getEntityLookupKey("User", user.id)!,
        buildSubmittedBy(user),
      );
    }
  }

  const schoolIds = [...(idsByType.get("School") ?? [])];
  if (schoolIds.length) {
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true },
    });
    for (const school of schools) {
      labels.set(getEntityLookupKey("School", school.id)!, school.name);
    }
  }

  const clusterIds = [...(idsByType.get("Cluster") ?? [])];
  if (clusterIds.length) {
    const clusters = await prisma.cluster.findMany({
      where: { id: { in: clusterIds } },
      select: { id: true, cluster_number: true, name: true },
    });
    for (const cluster of clusters) {
      labels.set(
        getEntityLookupKey("Cluster", cluster.id)!,
        cluster.name
          ? `Cluster ${cluster.cluster_number} — ${cluster.name}`
          : `Cluster ${cluster.cluster_number}`,
      );
    }
  }

  const programIds = [...(idsByType.get("Program") ?? [])];
  if (programIds.length) {
    const programs = await prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true, title: true },
    });
    for (const program of programs) {
      labels.set(getEntityLookupKey("Program", program.id)!, program.title);
    }
  }

  const deadlineIds = [...(idsByType.get("Deadline") ?? [])];
  if (deadlineIds.length) {
    const deadlines = await prisma.deadline.findMany({
      where: { id: { in: deadlineIds } },
      select: { id: true, year: true, quarter: true },
    });
    for (const deadline of deadlines) {
      labels.set(
        getEntityLookupKey("Deadline", deadline.id)!,
        `Deadline Q${deadline.quarter} ${deadline.year}`,
      );
    }
  }

  const sessionIds = [...(idsByType.get("UserSession") ?? [])];
  if (sessionIds.length) {
    const sessions = await prisma.userSession.findMany({
      where: { id: { in: sessionIds } },
      select: {
        id: true,
        device_label: true,
        user: {
          select: {
            role: true,
            email: true,
            name: true,
            first_name: true,
            middle_initial: true,
            last_name: true,
          },
        },
      },
    });
    for (const session of sessions) {
      labels.set(
        getEntityLookupKey("UserSession", session.id)!,
        `${buildSubmittedBy(session.user)} — ${session.device_label ?? "Unknown device"}`,
      );
    }
  }

  const emailBlastIds = [...(idsByType.get("EmailBlastLog") ?? [])];
  if (emailBlastIds.length) {
    const blasts = await prisma.emailBlastLog.findMany({
      where: { id: { in: emailBlastIds } },
      select: { id: true, blast_label: true, blast_type: true },
    });
    for (const blast of blasts) {
      labels.set(
        getEntityLookupKey("EmailBlastLog", blast.id)!,
        `${blast.blast_type.toUpperCase()} blast — ${blast.blast_label}`,
      );
    }
  }

  const templateIds = [...(idsByType.get("ProgramTemplate") ?? [])];
  if (templateIds.length) {
    const templates = await prisma.programTemplate.findMany({
      where: { id: { in: templateIds } },
      select: {
        id: true,
        target_code: true,
        program: { select: { title: true } },
      },
    });
    for (const template of templates) {
      labels.set(
        getEntityLookupKey("ProgramTemplate", template.id)!,
        `${template.program.title} — ${template.target_code}`,
      );
    }
  }

  for (const id of idsByType.get("DivisionConfig") ?? []) {
    labels.set(getEntityLookupKey("DivisionConfig", id)!, "Division configuration");
  }
  for (const id of idsByType.get("EmailConfig") ?? []) {
    labels.set(getEntityLookupKey("EmailConfig", id)!, "Email configuration");
  }
  for (const id of idsByType.get("Export") ?? []) {
    labels.set(getEntityLookupKey("Export", id)!, "Export");
  }
  for (const id of idsByType.get("backup") ?? []) {
    labels.set(getEntityLookupKey("backup", id)!, "System backup");
  }

  return labels;
}
