import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import {
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  type TxClient,
  withAdvisoryLock,
} from "../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { ConflictError, HttpError } from "../../lib/errors.ts";
import { pushNotification } from "../../lib/notifStream.ts";
import { normalizeQuarterLabel } from "../../lib/quarters.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import {
  OBSERVER_ROLE,
  requireCES,
  requireClusterHead,
} from "./shared/guards.ts";
import {
  PIR_DETAIL_INCLUDE,
  PIR_LIST_INCLUDE,
  REVIEW_QUEUE_INCLUDE,
} from "./shared/prismaSelects.ts";
import { canReadPirRecord, pirReadableWhereFor } from "./shared/pirAccess.ts";
import { adminAsyncHandler } from "./submissions/asyncHandler.ts";

const pirReviewRoutes = new Hono();

const PIR_READABLE_ROLES = [
  "Admin",
  "CES-SGOD",
  "CES-ASDS",
  "CES-CID",
  "Cluster Coordinator",
  OBSERVER_ROLE,
];

async function withPirReviewLock<T>(
  pirId: number,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  const currentPir = await prisma.pIR.findUnique({
    where: { id: pirId },
    select: { aip_id: true, quarter: true },
  });
  if (!currentPir) {
    throw new HttpError(404, "PIR not found", "NOT_FOUND");
  }
  return withAdvisoryLock(
    LOCK_NAMESPACE.PIR,
    pirResourceKeyFromRecord(currentPir),
    fn,
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
    id: pir.id,
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

  const pirId = safeParseInt(c.req.param("id"), 0);
  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: PIR_DETAIL_INCLUDE,
  });
  if (!pir) return c.json({ error: "PIR not found" }, 404);
  if (!canReadPirRecord(tokenUser, pir as any)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const factorsMap: Record<string, any> = {};
  for (const factor of pir.factors) {
    factorsMap[factor.factor_type] = {
      facilitating: factor.facilitating_factors,
      hindering: factor.hindering_factors,
      recommendations: (factor as any).recommendations ?? "",
    };
  }

  return c.json({
    id: pir.id,
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
    presented: (pir as any).presented ?? false,
    adminRemarks: (pir as any).remarks ?? null,
    observerNotes: (pir as any).observer_notes ?? "",
    activities: pir.activity_reviews.map((review: any) => ({
      id: review.id,
      name: review.aip_activity?.activity_name ?? "",
      implementation_period: review.aip_activity?.implementation_period ?? "",
      complied: review.complied,
      actualTasksConducted: review.actual_tasks_conducted ?? "",
      contributoryIndicators: review.contributory_performance_indicators ?? "",
      movsExpectedOutputs: review.movs_expected_outputs ?? "",
      adjustments: review.adjustments ?? "",
      isUnplanned: review.is_unplanned ?? false,
      physTarget: review.physical_target,
      finTarget: review.financial_target,
      physAcc: review.physical_accomplished,
      finAcc: review.financial_accomplished,
      actions: review.actions_to_address_gap ?? "",
      adminNotes: review.admin_notes ?? "",
    })),
    factors: factorsMap,
  });
});

pirReviewRoutes.get("/ces/pirs", async (c) => {
  const tokenUser = await requireCES(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const quarter = c.req.query("quarter")
    ? normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
    : undefined;
  const cesFilter: Record<string, any> = {
    "CES-SGOD": { aip: { school_id: null, program: { division: "SGOD" } } },
    "CES-ASDS": { aip: { school_id: null, program: { division: "OSDS" } } },
    "CES-CID": {
      aip: { school_id: null },
      OR: [
        { aip: { program: { division: "CID" } } },
        { aip: { created_by: { role: "Cluster Coordinator" } } },
      ],
    },
  };
  const roleFilter = cesFilter[tokenUser.role] ?? {};

  const pirs = await prisma.pIR.findMany({
    where: {
      status: { in: ["For CES Review", "Under Review"] },
      ...roleFilter,
      ...(quarter ? { quarter } : {}),
    },
    include: REVIEW_QUEUE_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return c.json(pirs.map((pir: any) => ({
    id: pir.id,
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

pirReviewRoutes.post(
  "/ces/pirs/:id/start-review",
  adminAsyncHandler(
    "CES start PIR review failed",
    "Failed to start PIR review",
    async (c) => {
      const tokenUser = await requireCES(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirId = safeParseInt(c.req.param("id"), 0);
      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true } } },
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

      const pirId = safeParseInt(c.req.param("id"), 0);
      const { ces_remarks } = sanitizeObject(await c.req.json());
      if (ces_remarks && ces_remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true, school: true } } },
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

      const pirId = safeParseInt(c.req.param("id"), 0);
      const { ces_remarks } = sanitizeObject(await c.req.json());
      if (ces_remarks && ces_remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true, school: true } } },
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

pirReviewRoutes.get("/cluster-head/pirs", async (c) => {
  const tokenUser = await requireClusterHead(c);
  if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

  const quarter = c.req.query("quarter")
    ? normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
    : undefined;
  const pirs = await prisma.pIR.findMany({
    where: {
      status: { in: ["For Cluster Head Review", "Under Review"] },
      aip: { school: { cluster_id: tokenUser.cluster_id ?? -1 } },
      ...(quarter ? { quarter } : {}),
    },
    include: REVIEW_QUEUE_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return c.json(pirs.map((pir: any) => ({
    id: pir.id,
    quarter: pir.quarter,
    status: pir.status,
    program: pir.aip.program.title,
    school: pir.aip.school?.name ?? "—",
    cluster: pir.aip.school?.cluster
      ? `Cluster ${pir.aip.school.cluster.cluster_number}`
      : "—",
    owner: pir.program_owner,
    submittedAt: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
    activeReviewerName: pir.active_reviewer
      ? buildSubmittedBy(pir.active_reviewer)
      : null,
    activeReviewStartedAt: pir.active_review_started_at ?? null,
  })));
});

pirReviewRoutes.post(
  "/cluster-head/pirs/:id/start-review",
  adminAsyncHandler(
    "Cluster head start PIR review failed",
    "Failed to start PIR review",
    async (c) => {
      const tokenUser = await requireClusterHead(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirId = safeParseInt(c.req.param("id"), 0);
      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true, school: true } } },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if (
          !["For Cluster Head Review", "Under Review"].includes(
            (lockedPir as any).status,
          )
        ) {
          throw new ConflictError("PIR is not in a reviewable state");
        }
        if (
          (lockedPir as any).aip.school?.cluster_id !== tokenUser.cluster_id
        ) {
          throw new HttpError(403, "Forbidden", "FORBIDDEN");
        }
        if ((lockedPir as any).active_reviewer_id !== null) {
          throw new ConflictError("PIR is already under review");
        }

        return tx.pIR.update({
          where: { id: pirId },
          data: {
            status: "Under Review",
            active_reviewer_id: tokenUser.id,
            active_review_started_at: new Date(),
          },
          include: { aip: { include: { program: true, school: true } } },
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
  "/cluster-head/pirs/:id/note",
  adminAsyncHandler(
    "Cluster head note PIR failed",
    "Failed to note PIR",
    async (c) => {
      const tokenUser = await requireClusterHead(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirId = safeParseInt(c.req.param("id"), 0);
      const { remarks } = sanitizeObject(await c.req.json());
      if (remarks && remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: {
            aip: {
              include: {
                program: true,
                school: { include: { cluster: true } },
              },
            },
          },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if (
          !["For Cluster Head Review", "Under Review"].includes(
            (lockedPir as any).status,
          )
        ) {
          throw new ConflictError("PIR is not pending Cluster Head review");
        }
        if (
          (lockedPir as any).aip.school?.cluster_id !== tokenUser.cluster_id
        ) {
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
            ces_remarks: remarks ?? null,
          },
          include: {
            aip: {
              include: {
                program: true,
                school: { include: { cluster: true } },
              },
            },
          },
        });
      });

      if ((pir as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (pir as any).created_by_user_id,
            title: "PIR Approved",
            message: `Your PIR for ${(pir as any).aip.program.title} (${
              (pir as any).quarter
            }) has been noted and approved by the Cluster Head.`,
            type: "approved",
            entity_id: (pir as any).id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(
        tokenUser.id,
        "cluster_head_noted_pir",
        "PIR",
        pirId,
        { remarks: remarks ?? null },
        { ctx: c },
      );
      return c.json({ success: true });
    },
  ),
);

pirReviewRoutes.post(
  "/cluster-head/pirs/:id/return",
  adminAsyncHandler(
    "Cluster head return PIR failed",
    "Failed to return PIR",
    async (c) => {
      const tokenUser = await requireClusterHead(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirId = safeParseInt(c.req.param("id"), 0);
      const { remarks } = sanitizeObject(await c.req.json());
      if (remarks && remarks.length > 5000) {
        return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
      }

      const pir = await withPirReviewLock(pirId, async (tx) => {
        const lockedPir = await tx.pIR.findUnique({
          where: { id: pirId },
          include: {
            aip: {
              include: {
                program: true,
                school: { include: { cluster: true } },
              },
            },
          },
        });
        if (!lockedPir) {
          throw new HttpError(404, "PIR not found", "NOT_FOUND");
        }
        if ((lockedPir as any).status !== "For Cluster Head Review") {
          throw new ConflictError("PIR is not pending Cluster Head review");
        }
        if (
          (lockedPir as any).aip.school?.cluster_id !== tokenUser.cluster_id
        ) {
          throw new HttpError(403, "Forbidden", "FORBIDDEN");
        }

        return tx.pIR.update({
          where: { id: pirId },
          data: {
            status: "Returned",
            ces_reviewer_id: tokenUser.id,
            ces_noted_at: new Date(),
            ces_remarks: remarks ?? null,
          },
          include: {
            aip: {
              include: {
                program: true,
                school: { include: { cluster: true } },
              },
            },
          },
        });
      });

      if ((pir as any).created_by_user_id) {
        const notification = await prisma.notification.create({
          data: {
            user_id: (pir as any).created_by_user_id,
            title: "PIR Returned by Cluster Head",
            message: `Your PIR for ${(pir as any).aip.program.title} (${
              (pir as any).quarter
            }) was returned by the Cluster Head.${
              remarks ? ` Feedback: ${remarks}` : ""
            }`,
            type: "returned",
            entity_id: (pir as any).id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(
        tokenUser.id,
        "cluster_head_returned_pir",
        "PIR",
        pirId,
        { remarks: remarks ?? null },
        { ctx: c },
      );
      return c.json({ success: true });
    },
  ),
);

export default pirReviewRoutes;
