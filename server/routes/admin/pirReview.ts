import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  type TxClient,
  withAdvisoryLock,
} from "../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { ConflictError, HttpError } from "../../lib/errors.ts";
import { pushNotification } from "../../lib/notifStream.ts";
import { normalizeQuarterLabel } from "../../lib/quarters.ts";
import { getCESRoleForDivisionPIR } from "../../lib/routing.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import {
  OBSERVER_ROLE,
  requireCES,
} from "./shared/guards.ts";
import {
  PIR_DETAIL_INCLUDE,
  PIR_LIST_INCLUDE,
  REVIEW_QUEUE_INCLUDE,
} from "./shared/prismaSelects.ts";
import { canReadPirRecord, pirReadableWhereFor } from "./shared/pirAccess.ts";
import {
  documentWhereFromRef,
  publicDocumentRef,
} from "./shared/documentRefs.ts";
import { adminAsyncHandler } from "./submissions/asyncHandler.ts";
import {
  factorFieldsToClientShape,
  pirActivityClientId,
} from "../data/shared/normalize.ts";

const pirReviewRoutes = new Hono();

const PIR_READABLE_ROLES = [
  "Admin",
  "CES-SGOD",
  "CES-ASDS",
  "CES-CID",
  OBSERVER_ROLE,
];

function canCESReviewDivision(role: string, division: string | null): boolean {
  return getCESRoleForDivisionPIR(division) === role;
}

function canCESReviewAipRecord(
  role: string,
  aip: {
    school_id?: number | null;
    focal_person_id?: number | null;
    program?: { division?: string | null } | null;
  },
): boolean {
  return aip.school_id != null &&
    aip.focal_person_id != null &&
    canCESReviewDivision(role, aip.program?.division ?? null);
}

function canCESReviewPirRecord(
  role: string,
  pir: {
    focal_person_id?: number | null;
    aip?: {
      school_id?: number | null;
      program?: { division?: string | null } | null;
      created_by?: { role?: string | null } | null;
    } | null;
  },
): boolean {
  const aip = pir.aip;
  if (!aip) return false;
  if (aip.school_id != null) {
    return pir.focal_person_id != null &&
      canCESReviewDivision(role, aip.program?.division ?? null);
  }
  return canCESReviewDivision(role, aip.program?.division ?? null);
}

function cesSchoolProgramWhere(role: string): Record<string, any> {
  if (role === "CES-SGOD") return { division: "SGOD" };
  if (role === "CES-ASDS") return { division: "OSDS" };
  return { OR: [{ division: "CID" }, { division: null }] };
}

function cesPirWhereForRole(role: string): Record<string, any> {
  const schoolRecommended = {
    focal_person_id: { not: null },
    aip: {
      school_id: { not: null },
      program: cesSchoolProgramWhere(role),
    },
  };

  if (role === "CES-SGOD") {
    return {
      OR: [
        { aip: { school_id: null, program: { division: "SGOD" } } },
        schoolRecommended,
      ],
    };
  }
  if (role === "CES-ASDS") {
    return {
      OR: [
        { aip: { school_id: null, program: { division: "OSDS" } } },
        schoolRecommended,
      ],
    };
  }
  return {
    OR: [
      {
        aip: {
          school_id: null,
          program: { OR: [{ division: "CID" }, { division: null }] },
        },
      },
      schoolRecommended,
    ],
  };
}

function cesAipWhereForRole(role: string): Record<string, any> {
  return {
    school_id: { not: null },
    focal_person_id: { not: null },
    program: cesSchoolProgramWhere(role),
  };
}

async function withPirReviewLock<T>(
  pirRef: string,
  fn: (tx: TxClient, pirId: number) => Promise<T>,
): Promise<T> {
  const currentPir = await prisma.pIR.findUnique({
    where: documentWhereFromRef(pirRef),
    select: { id: true, aip_id: true, quarter: true },
  });
  if (!currentPir) {
    throw new HttpError(404, "PIR not found", "NOT_FOUND");
  }
  return withAdvisoryLock(
    LOCK_NAMESPACE.PIR,
    pirResourceKeyFromRecord(currentPir),
    (tx) => fn(tx, currentPir.id),
  );
}

async function withAipReviewLock<T>(
  aipRef: string,
  fn: (tx: TxClient, aipId: number) => Promise<T>,
): Promise<T> {
  const currentAip = await prisma.aIP.findUnique({
    where: documentWhereFromRef(aipRef),
    select: {
      id: true,
      school_id: true,
      created_by_user_id: true,
      program_id: true,
      year: true,
    },
  });
  if (!currentAip) {
    throw new HttpError(404, "AIP not found", "NOT_FOUND");
  }
  return withAdvisoryLock(
    LOCK_NAMESPACE.AIP,
    aipResourceKeyFromRecord(currentAip),
    (tx) => fn(tx, currentAip.id),
  );
}

pirReviewRoutes.get("/pirs", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);
  if (!PIR_READABLE_ROLES.includes(tokenUser.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const quarter = c.req.query("quarter")
    ? normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
    : undefined;
  const pirs = await prisma.pIR.findMany({
    where: {
      ...pirReadableWhereFor(tokenUser),
      ...(quarter ? { quarter } : {}),
    },
    include: PIR_LIST_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return c.json(pirs.map((pir: any) => ({
    id: publicDocumentRef(pir),
    internalId: pir.id,
    quarter: pir.quarter,
    status: pir.status,
    program: pir.aip.program.title,
    school: pir.aip.school?.name ?? "Division",
    owner: pir.program_owner,
    submittedAt: pir.created_at,
    submittedBy: pir.created_by
      ? (pir.created_by.name ??
        [pir.created_by.first_name, pir.created_by.last_name]
          .filter(Boolean)
          .join(" "))
      : null,
  })));
});

pirReviewRoutes.get("/pirs/:id", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);
  if (!PIR_READABLE_ROLES.includes(tokenUser.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const pir = await prisma.pIR.findUnique({
    where: documentWhereFromRef(c.req.param("id")),
    include: PIR_DETAIL_INCLUDE,
  });
  if (!pir) return c.json({ error: "PIR not found" }, 404);
  if (!canReadPirRecord(tokenUser, pir as any)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const factorsMap: Record<string, any> = {};
  for (const factor of pir.factors) {
    factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
  }

  return c.json({
    id: publicDocumentRef(pir as any),
    internalId: pir.id,
    quarter: pir.quarter,
    status: pir.status,
    program: (pir as any).aip.program.title,
    school: (pir as any).aip.school?.name ?? "Division",
    schoolLogo: (pir as any).aip.school?.logo ?? null,
    clusterNumber: (pir as any).aip.school?.cluster?.cluster_number ?? null,
    clusterLogo: (pir as any).aip.school?.cluster?.logo ?? null,
    owner: pir.program_owner,
    budgetFromDivision: (pir as any).budget_from_division,
    budgetFromCoPSF: (pir as any).budget_from_co_psf,
    indicatorQuarterlyTargets: (pir as any).indicator_quarterly_targets ?? [],
    actionItems: (pir as any).action_items ?? [],
    cesReviewer: (pir as any).ces_reviewer?.name ?? null,
    cesNotedAt: (pir as any).ces_noted_at ?? null,
    cesRemarks: (pir as any).ces_remarks ?? null,
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
  });
});

pirReviewRoutes.get("/ces/pirs", async (c) => {
  const tokenUser = await requireCES(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const quarter = c.req.query("quarter")
    ? normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
    : undefined;
  const pirs = await prisma.pIR.findMany({
    where: {
      status: { in: ["For CES Review", "Under Review"] },
      ...cesPirWhereForRole(tokenUser.role),
      ...(quarter ? { quarter } : {}),
    },
    include: REVIEW_QUEUE_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return c.json(pirs.map((pir: any) => ({
    id: publicDocumentRef(pir),
    internalId: pir.id,
    quarter: pir.quarter,
    status: pir.status,
    program: pir.aip.program.title,
    school: pir.aip.school?.name ?? "Division",
    owner: pir.program_owner,
    functionalDivision: pir.functional_division,
    submittedAt: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
    activeReviewerName: pir.active_reviewer
      ? buildSubmittedBy(pir.active_reviewer)
      : null,
    activeReviewStartedAt: pir.active_review_started_at ?? null,
  })));
});

function serializeCesAipQueueItem(aip: any) {
  return {
    id: publicDocumentRef(aip),
    internalId: aip.id,
    year: aip.year,
    status: aip.status,
    program: aip.program.title,
    school: aip.school?.name ?? "School",
    submittedAt: aip.created_at,
    submittedBy: buildSubmittedBy(aip.created_by),
    focalPerson: aip.focal_person ? buildSubmittedBy(aip.focal_person) : null,
    focalRecommendedAt: aip.focal_recommended_at ?? null,
    focalRemarks: aip.focal_remarks ?? null,
  };
}

function serializeCesAipDetail(aip: any) {
  return {
    ...serializeCesAipQueueItem(aip),
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
    cesReviewer: aip.ces_reviewer?.name ?? null,
    cesNotedAt: aip.ces_noted_at ?? null,
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

pirReviewRoutes.get("/ces/aips", async (c) => {
  const tokenUser = await requireCES(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const year = c.req.query("year") ? Number(c.req.query("year")) : undefined;
  const aips = await prisma.aIP.findMany({
    where: {
      status: "For CES Review",
      ...cesAipWhereForRole(tokenUser.role),
      ...(year && Number.isInteger(year) ? { year } : {}),
    },
    include: {
      program: true,
      school: true,
      created_by: {
        select: { name: true, first_name: true, last_name: true, email: true },
      },
      focal_person: {
        select: { name: true, first_name: true, last_name: true, email: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return c.json(aips.map(serializeCesAipQueueItem));
});

pirReviewRoutes.get("/ces/aips/:id", async (c) => {
  const tokenUser = await requireCES(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const aip = await prisma.aIP.findUnique({
    where: documentWhereFromRef(c.req.param("id")),
    include: {
      program: true,
      school: true,
      created_by: {
        select: { name: true, first_name: true, last_name: true, email: true },
      },
      focal_person: {
        select: { name: true, first_name: true, last_name: true, email: true },
      },
      ces_reviewer: { select: { name: true, role: true } },
      activities: { orderBy: { id: "asc" } },
    },
  });
  if (!aip) return c.json({ error: "AIP not found" }, 404);
  if (!canCESReviewAipRecord(tokenUser.role, aip as any)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(serializeCesAipDetail(aip));
});

pirReviewRoutes.post(
  "/ces/aips/:id/approve",
  adminAsyncHandler(
    "CES approve AIP failed",
    "Failed to approve AIP",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const { ces_remarks } = sanitizeObject(
        await c.req.json().catch(() => ({})),
      );
      const remarks = typeof ces_remarks === "string" ? ces_remarks.trim() : "";
      if (remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      let aipId = 0;
      const aip = await withAipReviewLock(
        c.req.param("id") ?? "",
        async (tx, lockedAipId) => {
          aipId = lockedAipId;
          const lockedAip = await tx.aIP.findUnique({
            where: { id: aipId },
            include: { program: true, school: true },
          });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }
          if (lockedAip.status !== "For CES Review") {
            throw new ConflictError("AIP is not pending CES review");
          }
          if (!canCESReviewAipRecord(tokenUser.role, lockedAip as any)) {
            throw new HttpError(403, "Forbidden", "FORBIDDEN");
          }

          return tx.aIP.update({
            where: { id: aipId },
            data: {
              status: "Approved",
              ces_reviewer_id: tokenUser.id,
              ces_noted_at: new Date(),
              ces_remarks: remarks || null,
            },
            include: { program: true, school: true },
          });
        },
      );

      if ((aip as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (aip as any).created_by_user_id,
            title: "AIP Approved",
            message: `Your AIP for ${(aip as any).program.title} (FY ${
              (aip as any).year
            }) has been approved by CES.`,
            type: "approved",
            entity_id: (aip as any).id,
            entity_type: "aip",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(tokenUser.id, "ces_approved_aip", "AIP", aipId, {
        ces_remarks: remarks || null,
      }, { ctx: c });
      return c.json({ success: true, aip });
    },
  ),
);

pirReviewRoutes.post(
  "/ces/aips/:id/return",
  adminAsyncHandler(
    "CES return AIP failed",
    "Failed to return AIP",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const { ces_remarks } = sanitizeObject(
        await c.req.json().catch(() => ({})),
      );
      const remarks = typeof ces_remarks === "string" ? ces_remarks.trim() : "";
      if (!remarks) {
        return c.json({
          error: "Remarks are required when returning a document",
        }, 400);
      }
      if (remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      let aipId = 0;
      const aip = await withAipReviewLock(
        c.req.param("id") ?? "",
        async (tx, lockedAipId) => {
          aipId = lockedAipId;
          const lockedAip = await tx.aIP.findUnique({
            where: { id: aipId },
            include: { program: true, school: true },
          });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }
          if (lockedAip.status !== "For CES Review") {
            throw new ConflictError("AIP is not pending CES review");
          }
          if (!canCESReviewAipRecord(tokenUser.role, lockedAip as any)) {
            throw new HttpError(403, "Forbidden", "FORBIDDEN");
          }

          return tx.aIP.update({
            where: { id: aipId },
            data: {
              status: "Returned",
              ces_reviewer_id: tokenUser.id,
              ces_noted_at: new Date(),
              ces_remarks: remarks,
            },
            include: { program: true, school: true },
          });
        },
      );

      if ((aip as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (aip as any).created_by_user_id,
            title: "AIP Returned by CES",
            message: `Your AIP for ${(aip as any).program.title} (FY ${
              (aip as any).year
            }) was returned by CES. Feedback: ${remarks}`,
            type: "returned",
            entity_id: (aip as any).id,
            entity_type: "aip",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(tokenUser.id, "ces_returned_aip", "AIP", aipId, {
        ces_remarks: remarks,
      }, { ctx: c });
      return c.json({ success: true });
    },
  ),
);

pirReviewRoutes.post(
  "/ces/pirs/:id/start-review",
  adminAsyncHandler(
    "CES start PIR review failed",
    "Failed to start PIR review",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirRef = c.req.param("id") ?? "";
      let pirId = 0;
      const pir = await withPirReviewLock(pirRef, async (tx, lockedPirId) => {
        pirId = lockedPirId;
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true, created_by: true } } },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if (
          !["For CES Review", "Under Review"].includes(
            (lockedPir as any).status,
          )
        ) {
          throw new ConflictError("PIR is not in a reviewable state");
        }
        if ((lockedPir as any).active_reviewer_id !== null) {
          throw new ConflictError("PIR is already under review");
        }
        if (!canCESReviewPirRecord(tokenUser.role, lockedPir as any)) {
          throw new HttpError(403, "Forbidden", "FORBIDDEN");
        }

        return tx.pIR.update({
          where: { id: pirId },
          data: {
            status: "Under Review",
            active_reviewer_id: tokenUser.id,
            active_review_started_at: new Date(),
          },
          include: { aip: { include: { program: true } } },
        });
      });

      if ((pir as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (pir as any).created_by_user_id,
            title: "PIR Under Review",
            message: `Your PIR for ${(pir as any).aip.program.title} (${
              (pir as any).quarter
            }) is now under review.`,
            type: "under_review",
            entity_id: (pir as any).id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(
        tokenUser.id,
        "started_pir_review",
        "PIR",
        pirId,
        {},
        { ctx: c },
      );
      return c.json({ success: true });
    },
  ),
);

pirReviewRoutes.post(
  "/ces/pirs/:id/note",
  adminAsyncHandler(
    "CES note PIR failed",
    "Failed to note PIR",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirRef = c.req.param("id") ?? "";
      let pirId = 0;
      const { ces_remarks } = sanitizeObject(await c.req.json());
      if (ces_remarks && ces_remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirRef, async (tx, lockedPirId) => {
        pirId = lockedPirId;
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: {
            aip: { include: { program: true, school: true, created_by: true } },
          },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if (
          !["For CES Review", "Under Review"].includes(
            (lockedPir as any).status,
          )
        ) {
          throw new ConflictError("PIR is not pending CES review");
        }
        if (!canCESReviewPirRecord(tokenUser.role, lockedPir as any)) {
          throw new HttpError(403, "Forbidden", "FORBIDDEN");
        }

        return tx.pIR.update({
          where: { id: pirId },
          data: {
            status: "Approved",
            active_reviewer_id: null,
            active_review_started_at: null,
            ces_reviewer_id: tokenUser.id,
            ces_noted_at: new Date(),
            ces_remarks: ces_remarks ?? null,
          },
          include: { aip: { include: { program: true, school: true } } },
        });
      });

      if ((pir as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (pir as any).created_by_user_id,
            title: "PIR Approved",
            message: `Your PIR for ${(pir as any).aip.program.title} (${
              (pir as any).quarter
            }) has been noted and approved by CES.`,
            type: "approved",
            entity_id: (pir as any).id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(tokenUser.id, "ces_noted_pir", "PIR", pirId, {
        ces_remarks: ces_remarks ?? null,
      }, { ctx: c });
      return c.json({ success: true, pir });
    },
  ),
);

pirReviewRoutes.post(
  "/ces/pirs/:id/return",
  adminAsyncHandler(
    "CES return PIR failed",
    "Failed to return PIR",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirRef = c.req.param("id") ?? "";
      let pirId = 0;
      const { ces_remarks } = sanitizeObject(await c.req.json());
      if (ces_remarks && ces_remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirRef, async (tx, lockedPirId) => {
        pirId = lockedPirId;
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: {
            aip: { include: { program: true, school: true, created_by: true } },
          },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if (
          !["For CES Review", "Under Review"].includes(
            (lockedPir as any).status,
          )
        ) {
          throw new ConflictError("PIR is not pending CES review");
        }
        if (!canCESReviewPirRecord(tokenUser.role, lockedPir as any)) {
          throw new HttpError(403, "Forbidden", "FORBIDDEN");
        }

        return tx.pIR.update({
          where: { id: pirId },
          data: {
            status: "Returned",
            active_reviewer_id: null,
            active_review_started_at: null,
            ces_reviewer_id: tokenUser.id,
            ces_noted_at: new Date(),
            ces_remarks: ces_remarks ?? null,
          },
          include: { aip: { include: { program: true, school: true } } },
        });
      });

      if ((pir as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (pir as any).created_by_user_id,
            title: "PIR Returned by CES",
            message: `Your PIR for ${(pir as any).aip.program.title} (${
              (pir as any).quarter
            }) was returned by CES.${
              ces_remarks ? ` Feedback: ${ces_remarks}` : ""
            }`,
            type: "returned",
            entity_id: (pir as any).id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(tokenUser.id, "ces_returned_pir", "PIR", pirId, {
        ces_remarks: ces_remarks ?? null,
      }, { ctx: c });
      return c.json({ success: true });
    },
  ),
);

export default pirReviewRoutes;
