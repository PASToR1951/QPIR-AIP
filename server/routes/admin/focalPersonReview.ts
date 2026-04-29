import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  type TxClient,
  withAdvisoryLock,
} from "../../lib/advisoryLock.ts";
import { getUserFromToken, type TokenPayload } from "../../lib/auth.ts";
import { ConflictError, HttpError } from "../../lib/errors.ts";
import { pushNotification, pushNotifications } from "../../lib/notifStream.ts";
import { getCESRoleForDivisionPIR } from "../../lib/routing.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import {
  documentWhereFromRef,
  publicDocumentRef,
} from "./shared/documentRefs.ts";
import { adminAsyncHandler } from "./submissions/asyncHandler.ts";
import { MAX_TEXT_LENGTH } from "./submissions/validation.ts";
import {
  factorFieldsToClientShape,
  pirActivityClientId,
} from "../data/shared/normalize.ts";

const focalRoutes = new Hono();

async function requireDivisionPersonnel(
  c: Parameters<typeof getUserFromToken>[0],
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Division Personnel") return null;
  return user;
}

function normalizeRemarks(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function assertRemarksLength(remarks: string) {
  if (remarks.length > MAX_TEXT_LENGTH) {
    throw new HttpError(
      400,
      "Remarks cannot exceed 5000 characters",
      "BAD_REQUEST",
    );
  }
}

async function isFocalForProgram(
  db: typeof prisma | TxClient,
  programId: number,
  userId: number,
) {
  const count = await db.programFocalPerson.count({
    where: {
      program_id: programId,
      user_id: userId,
      user: { role: "Division Personnel", is_active: true },
    },
  });
  return count > 0;
}

async function notifyCESUsers(
  program: { title: string; division: string | null },
  document: { id: number; label: string; entityType: "aip" | "pir" },
) {
  const cesRole = getCESRoleForDivisionPIR(program.division);
  const cesUsers = await prisma.user.findMany({
    where: { role: cesRole, is_active: true },
    select: { id: true },
  });
  if (cesUsers.length === 0) return;

  const notifications = await prisma.notification.createManyAndReturn({
    data: cesUsers.map((user) => ({
      user_id: user.id,
      title: `${document.label} Ready for CES Review`,
      message:
        `${document.label} for ${program.title} has been recommended and is awaiting your review.`,
      type: "for_ces_review",
      entity_id: document.id,
      entity_type: document.entityType,
    })),
  });
  pushNotifications(notifications);
}

async function notifySubmitter(
  userId: number | null,
  data: {
    title: string;
    message: string;
    type: string;
    entityId: number;
    entityType: "aip" | "pir";
  },
) {
  if (!userId) return;
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      title: data.title,
      message: data.message,
      type: data.type,
      entity_id: data.entityId,
      entity_type: data.entityType,
    },
  });
  pushNotification(notification);
}

async function withAipFocalLock<T>(
  ref: string,
  fn: (tx: TxClient, aipId: number) => Promise<T>,
): Promise<T> {
  const currentAip = await prisma.aIP.findUnique({
    where: documentWhereFromRef(ref),
    select: {
      id: true,
      school_id: true,
      created_by_user_id: true,
      program_id: true,
      year: true,
    },
  });
  if (!currentAip) throw new HttpError(404, "AIP not found", "NOT_FOUND");

  return withAdvisoryLock(
    LOCK_NAMESPACE.AIP,
    aipResourceKeyFromRecord(currentAip),
    (tx) => fn(tx, currentAip.id),
  );
}

async function withPirFocalLock<T>(
  ref: string,
  fn: (tx: TxClient, pirId: number) => Promise<T>,
): Promise<T> {
  const currentPir = await prisma.pIR.findUnique({
    where: documentWhereFromRef(ref),
    select: { id: true, aip_id: true, quarter: true },
  });
  if (!currentPir) throw new HttpError(404, "PIR not found", "NOT_FOUND");

  return withAdvisoryLock(
    LOCK_NAMESPACE.PIR,
    pirResourceKeyFromRecord(currentPir),
    (tx) => fn(tx, currentPir.id),
  );
}

function serializeAipQueueItem(aip: any) {
  return {
    id: publicDocumentRef(aip),
    internalId: aip.id,
    status: aip.status,
    year: aip.year,
    program: aip.program.title,
    school: aip.school?.name ?? "School",
    submittedAt: aip.created_at,
    submittedBy: buildSubmittedBy(aip.created_by),
  };
}

function serializePirQueueItem(pir: any) {
  return {
    id: publicDocumentRef(pir),
    internalId: pir.id,
    status: pir.status,
    quarter: pir.quarter,
    program: pir.aip.program.title,
    school: pir.aip.school?.name ?? "School",
    owner: pir.program_owner,
    submittedAt: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
  };
}

function serializeAipDetail(aip: any) {
  return {
    ...serializeAipQueueItem(aip),
    outcome: aip.outcome,
    targetDescription: aip.target_description,
    sipTitle: aip.sip_title,
    projectCoordinator: aip.project_coordinator,
    objectives: aip.objectives ?? [],
    indicators: aip.indicators ?? [],
    preparedByName: aip.prepared_by_name,
    preparedByTitle: aip.prepared_by_title,
    approvedByName: aip.approved_by_name,
    approvedByTitle: aip.approved_by_title,
    focalRemarks: aip.focal_remarks ?? null,
    cesRemarks: aip.ces_remarks ?? null,
    activities: aip.activities.map((activity: any) => ({
      id: activity.id,
      phase: activity.phase,
      name: activity.activity_name,
      implementationPeriod: activity.implementation_period,
      periodStartMonth: activity.period_start_month,
      periodEndMonth: activity.period_end_month,
      persons: activity.persons_involved,
      outputs: activity.outputs,
      budgetAmount: activity.budget_amount,
      budgetSource: activity.budget_source,
    })),
  };
}

function serializePirDetail(pir: any) {
  const factorsMap: Record<string, any> = {};
  for (const factor of pir.factors) {
    factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
  }

  return {
    ...serializePirQueueItem(pir),
    budgetFromDivision: pir.budget_from_division,
    budgetFromCoPSF: pir.budget_from_co_psf,
    functionalDivision: pir.functional_division ?? null,
    indicatorQuarterlyTargets: pir.indicator_quarterly_targets ?? [],
    actionItems: pir.action_items ?? [],
    focalRemarks: pir.focal_remarks ?? null,
    cesRemarks: pir.ces_remarks ?? null,
    activities: (() => {
      let unplannedIndex = 0;
      return pir.activity_reviews.map((review: any) => {
        const clientId = pirActivityClientId(review, unplannedIndex);
        if (review.is_unplanned) unplannedIndex += 1;
        return {
          id: clientId,
          aip_activity_id: review.aip_activity_id,
          fromAIP: Boolean(review.aip_activity_id),
          name: review.aip_activity?.activity_name ?? "",
          implementation_period: review.aip_activity?.implementation_period ??
            "",
          complied: review.complied,
          actualTasksConducted: review.actual_tasks_conducted ?? "",
          contributoryIndicators: review.contributory_performance_indicators ??
            "",
          movsExpectedOutputs: review.movs_expected_outputs ?? "",
          adjustments: review.adjustments ?? "",
          isUnplanned: review.is_unplanned ?? false,
          physTarget: review.physical_target,
          finTarget: review.financial_target,
          physAcc: review.physical_accomplished,
          finAcc: review.financial_accomplished,
          actions: review.actions_to_address_gap ?? "",
        };
      });
    })(),
    factors: factorsMap,
  };
}

focalRoutes.get(
  "/focal/pending-count",
  adminAsyncHandler(
    "Focal pending count failed",
    "Failed to fetch pending focal count",
    async (c) => {
      const tokenUser = await requireDivisionPersonnel(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const where = {
        status: "For Recommendation",
        focal_person_id: null,
        program: {
          focal_persons: { some: { user_id: tokenUser.id } },
        },
      };
      const [aips, pirs] = await Promise.all([
        prisma.aIP.count({ where: { ...where, school_id: { not: null } } }),
        prisma.pIR.count({
          where: {
            status: "For Recommendation",
            focal_person_id: null,
            aip: {
              school_id: { not: null },
              program: {
                focal_persons: { some: { user_id: tokenUser.id } },
              },
            },
          },
        }),
      ]);
      return c.json({ aips, pirs, total: aips + pirs });
    },
  ),
);

focalRoutes.get(
  "/focal/aips",
  adminAsyncHandler(
    "Focal AIP list failed",
    "Failed to fetch AIPs",
    async (c) => {
      const tokenUser = await requireDivisionPersonnel(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const aips = await prisma.aIP.findMany({
        where: {
          status: "For Recommendation",
          focal_person_id: null,
          school_id: { not: null },
          program: { focal_persons: { some: { user_id: tokenUser.id } } },
        },
        include: {
          program: true,
          school: true,
          created_by: {
            select: {
              name: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      return c.json(aips.map(serializeAipQueueItem));
    },
  ),
);

focalRoutes.get(
  "/focal/pirs",
  adminAsyncHandler(
    "Focal PIR list failed",
    "Failed to fetch PIRs",
    async (c) => {
      const tokenUser = await requireDivisionPersonnel(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirs = await prisma.pIR.findMany({
        where: {
          status: "For Recommendation",
          focal_person_id: null,
          aip: {
            school_id: { not: null },
            program: { focal_persons: { some: { user_id: tokenUser.id } } },
          },
        },
        include: {
          aip: { include: { program: true, school: true } },
          created_by: {
            select: {
              name: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      return c.json(pirs.map(serializePirQueueItem));
    },
  ),
);

focalRoutes.get(
  "/focal/aips/:id",
  adminAsyncHandler(
    "Focal AIP detail failed",
    "Failed to fetch AIP",
    async (c) => {
      const tokenUser = await requireDivisionPersonnel(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const aip = await prisma.aIP.findUnique({
        where: documentWhereFromRef(c.req.param("id")),
        include: {
          program: true,
          school: true,
          created_by: {
            select: {
              name: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          activities: { orderBy: { id: "asc" } },
        },
      });
      if (!aip) return c.json({ error: "AIP not found" }, 404);
      if (
        aip.school_id === null ||
        !(await isFocalForProgram(prisma, aip.program_id, tokenUser.id))
      ) {
        return c.json({ error: "Forbidden" }, 403);
      }

      return c.json(serializeAipDetail(aip));
    },
  ),
);

focalRoutes.get(
  "/focal/pirs/:id",
  adminAsyncHandler(
    "Focal PIR detail failed",
    "Failed to fetch PIR",
    async (c) => {
      const tokenUser = await requireDivisionPersonnel(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pir = await prisma.pIR.findUnique({
        where: documentWhereFromRef(c.req.param("id")),
        include: {
          aip: { include: { program: true, school: true } },
          created_by: {
            select: {
              name: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          activity_reviews: {
            orderBy: { id: "asc" },
            include: { aip_activity: true },
          },
          factors: true,
        },
      });
      if (!pir) return c.json({ error: "PIR not found" }, 404);
      if (
        pir.aip.school_id === null ||
        !(await isFocalForProgram(prisma, pir.aip.program_id, tokenUser.id))
      ) {
        return c.json({ error: "Forbidden" }, 403);
      }

      return c.json(serializePirDetail(pir));
    },
  ),
);

async function handleAipFocalAction(
  c: any,
  action: "recommend" | "return",
) {
  const tokenUser = await requireDivisionPersonnel(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const body = sanitizeObject(await c.req.json().catch(() => ({})));
  const remarks = normalizeRemarks(
    (body as any).focal_remarks ?? (body as any).remarks,
  );
  assertRemarksLength(remarks);
  if (action === "return" && !remarks) {
    return c.json(
      { error: "Remarks are required when returning a document" },
      400,
    );
  }

  const aip = await withAipFocalLock(
    c.req.param("id") ?? "",
    async (tx, aipId) => {
      const lockedAip = await tx.aIP.findUnique({
        where: { id: aipId },
        include: { program: true, school: true },
      });
      if (!lockedAip) throw new HttpError(404, "AIP not found", "NOT_FOUND");
      if (lockedAip.focal_person_id !== null) {
        throw new ConflictError(
          "Another reviewer has already acted on this document",
        );
      }
      if (
        lockedAip.status !== "For Recommendation" ||
        lockedAip.school_id === null
      ) {
        throw new ConflictError("Document is not pending focal recommendation");
      }
      if (!(await isFocalForProgram(tx, lockedAip.program_id, tokenUser.id))) {
        throw new HttpError(403, "Forbidden", "FORBIDDEN");
      }

      return tx.aIP.update({
        where: { id: aipId },
        data: action === "recommend"
          ? {
            status: "For CES Review",
            focal_person_id: tokenUser.id,
            focal_recommended_at: new Date(),
            focal_remarks: remarks || null,
          }
          : {
            status: "Returned",
            focal_person_id: tokenUser.id,
            focal_recommended_at: null,
            focal_remarks: remarks,
          },
        include: { program: true, school: true },
      });
    },
  );

  if (action === "recommend") {
    await notifyCESUsers(aip.program, {
      id: aip.id,
      label: "AIP",
      entityType: "aip",
    });
  } else {
    await notifySubmitter(aip.created_by_user_id, {
      title: "AIP Returned by Focal Person",
      message:
        `Your AIP for ${aip.program.title} (FY ${aip.year}) was returned for correction. Feedback: ${remarks}`,
      type: "returned",
      entityId: aip.id,
      entityType: "aip",
    });
  }

  await writeAuditLog(
    tokenUser.id,
    action === "recommend" ? "focal_recommended_aip" : "focal_returned_aip",
    "AIP",
    aip.id,
    { remarks: remarks || null },
    { ctx: c },
  );

  return c.json({ success: true, aip });
}

async function handlePirFocalAction(
  c: any,
  action: "recommend" | "return",
) {
  const tokenUser = await requireDivisionPersonnel(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const body = sanitizeObject(await c.req.json().catch(() => ({})));
  const remarks = normalizeRemarks(
    (body as any).focal_remarks ?? (body as any).remarks,
  );
  assertRemarksLength(remarks);
  if (action === "return" && !remarks) {
    return c.json(
      { error: "Remarks are required when returning a document" },
      400,
    );
  }

  const pir = await withPirFocalLock(
    c.req.param("id") ?? "",
    async (tx, pirId) => {
      const lockedPir = await tx.pIR.findUnique({
        where: { id: pirId },
        include: { aip: { include: { program: true, school: true } } },
      });
      if (!lockedPir) throw new HttpError(404, "PIR not found", "NOT_FOUND");
      if (lockedPir.focal_person_id !== null) {
        throw new ConflictError(
          "Another reviewer has already acted on this document",
        );
      }
      if (
        lockedPir.status !== "For Recommendation" ||
        lockedPir.aip.school_id === null
      ) {
        throw new ConflictError("Document is not pending focal recommendation");
      }
      if (
        !(await isFocalForProgram(tx, lockedPir.aip.program_id, tokenUser.id))
      ) {
        throw new HttpError(403, "Forbidden", "FORBIDDEN");
      }

      return tx.pIR.update({
        where: { id: pirId },
        data: action === "recommend"
          ? {
            status: "For CES Review",
            focal_person_id: tokenUser.id,
            focal_recommended_at: new Date(),
            focal_remarks: remarks || null,
          }
          : {
            status: "Returned",
            focal_person_id: tokenUser.id,
            focal_recommended_at: null,
            focal_remarks: remarks,
          },
        include: { aip: { include: { program: true, school: true } } },
      });
    },
  );

  if (action === "recommend") {
    await notifyCESUsers(pir.aip.program, {
      id: pir.id,
      label: "PIR",
      entityType: "pir",
    });
  } else {
    await notifySubmitter(pir.created_by_user_id, {
      title: "PIR Returned by Focal Person",
      message:
        `Your PIR for ${pir.aip.program.title} (${pir.quarter}) was returned for correction. Feedback: ${remarks}`,
      type: "returned",
      entityId: pir.id,
      entityType: "pir",
    });
  }

  await writeAuditLog(
    tokenUser.id,
    action === "recommend" ? "focal_recommended_pir" : "focal_returned_pir",
    "PIR",
    pir.id,
    { remarks: remarks || null },
    { ctx: c },
  );

  return c.json({ success: true, pir });
}

focalRoutes.post(
  "/focal/aips/:id/recommend",
  adminAsyncHandler(
    "Focal recommend AIP failed",
    "Failed to recommend AIP",
    (c) => handleAipFocalAction(c, "recommend"),
  ),
);

focalRoutes.post(
  "/focal/aips/:id/return",
  adminAsyncHandler(
    "Focal return AIP failed",
    "Failed to return AIP",
    (c) => handleAipFocalAction(c, "return"),
  ),
);

focalRoutes.post(
  "/focal/pirs/:id/recommend",
  adminAsyncHandler(
    "Focal recommend PIR failed",
    "Failed to recommend PIR",
    (c) => handlePirFocalAction(c, "recommend"),
  ),
);

focalRoutes.post(
  "/focal/pirs/:id/return",
  adminAsyncHandler(
    "Focal return PIR failed",
    "Failed to return PIR",
    (c) => handlePirFocalAction(c, "return"),
  ),
);

export default focalRoutes;
