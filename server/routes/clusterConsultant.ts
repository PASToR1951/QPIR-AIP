import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import {
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
} from "../lib/advisoryLock.ts";
import { getUserFromToken, type TokenPayload } from "../lib/auth.ts";
import { HttpError } from "../lib/errors.ts";
import { pushNotification } from "../lib/notifStream.ts";
import { normalizeQuarterLabel } from "../lib/quarters.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";
import { sanitizeObject, sanitizeString } from "../lib/sanitize.ts";
import {
  factorFieldsToClientShape,
  pirActivityClientId,
} from "./data/shared/normalize.ts";
import { writeAuditLog } from "./admin/shared/audit.ts";
import { buildSubmittedBy } from "./admin/shared/display.ts";
import {
  documentWhereFromRef,
  publicDocumentRef,
} from "./admin/shared/documentRefs.ts";
import { adminAsyncHandler } from "./admin/submissions/asyncHandler.ts";
import { MAX_TEXT_LENGTH } from "./admin/submissions/validation.ts";

const clusterConsultantRoutes = new Hono();

const CLUSTER_CONSULTANT_ROLE = "Cluster Consultant";
const VALID_SCOPES = new Set(["overall", "section"]);
const VALID_CATEGORIES = new Set(["suggested_change", "mistake"]);
const VALID_SECTION_KEYS = new Set([
  "profile",
  "financials",
  "indicators",
  "activities",
  "factors",
  "action_items",
  "monitoring_evaluation",
  "other",
]);
const PENDING_REVIEW_STATUSES = [
  "For Recommendation",
  "For CES Review",
  "For Superintendent Review",
  "For Admin Review",
  "Under Review",
];

async function requireClusterConsultant(
  c: Parameters<typeof getUserFromToken>[0],
) {
  const user = await getUserFromToken(c);
  if (!user || user.role !== CLUSTER_CONSULTANT_ROLE) return null;
  if (!user.cluster_id) return null;
  return user as TokenPayload & { cluster_id: number };
}

function parsePeriodFilters(c: any) {
  const year = safeParseInt(c.req.query("year"), 0, 2020, 2100) || undefined;
  const rawQuarter = c.req.query("quarter");
  let quarter: string | undefined;

  if (rawQuarter) {
    const quarterNumber = safeParseInt(rawQuarter, 0, 1, 4);
    if (quarterNumber && year) {
      const ordinals = ["", "1st", "2nd", "3rd", "4th"];
      quarter = `${ordinals[quarterNumber]} Quarter CY ${year}`;
    } else {
      quarter = normalizeQuarterLabel(sanitizeString(rawQuarter));
    }
  }

  return { year, quarter };
}

function clusterPirWhere(clusterId: number, c: any = {}) {
  const { year, quarter } = parsePeriodFilters(c);
  const status = sanitizeString(c.req?.query("status") ?? "").trim();
  const schoolQuery = sanitizeString(c.req?.query("school") ?? "").trim();
  const programQuery = sanitizeString(c.req?.query("program") ?? "").trim();
  const schoolId = safeParseInt(schoolQuery, 0);
  const programId = safeParseInt(programQuery, 0);

  return {
    deleted_at: null,
    status: status ? status : { not: "Draft" },
    ...(quarter ? { quarter } : {}),
    aip: {
      ...(year ? { year } : {}),
      school: {
        cluster_id: clusterId,
        ...(schoolId
          ? { id: schoolId }
          : schoolQuery
          ? { name: { contains: schoolQuery, mode: "insensitive" as const } }
          : {}),
      },
      ...(programId ? { program_id: programId } : programQuery
        ? {
          program: {
            title: { contains: programQuery, mode: "insensitive" as const },
          },
        }
        : {}),
    },
  };
}

function serializePirListItem(pir: any, commentCount = 0) {
  return {
    id: publicDocumentRef(pir),
    internalId: pir.id,
    status: pir.status,
    quarter: pir.quarter,
    year: pir.aip?.year ?? null,
    program: pir.aip?.program?.title ?? "",
    programId: pir.aip?.program?.id ?? null,
    school: pir.aip?.school?.name ?? "School",
    schoolId: pir.aip?.school?.id ?? null,
    submittedAt: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
    commentCount,
  };
}

function serializePirComment(comment: any) {
  return {
    id: comment.id,
    scope: comment.scope,
    sectionKey: comment.section_key ?? null,
    category: comment.category,
    body: comment.body,
    createdAt: comment.created_at,
  };
}

function serializePirDetail(pir: any, comments: any[] = []) {
  const factorsMap: Record<string, any> = {};
  for (const factor of pir.factors ?? []) {
    factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
  }

  let unplannedIndex = 0;
  return {
    ...serializePirListItem(pir),
    programOwner: pir.program_owner,
    budgetFromDivision: pir.budget_from_division,
    budgetFromCoPSF: pir.budget_from_co_psf,
    functionalDivision: pir.functional_division ?? null,
    indicatorQuarterlyTargets: pir.indicator_quarterly_targets ?? [],
    actionItems: pir.action_items ?? [],
    focalRemarks: pir.focal_remarks ?? null,
    cesRemarks: pir.ces_remarks ?? null,
    activities: (pir.activity_reviews ?? []).map((review: any) => {
      const clientId = pirActivityClientId(review, unplannedIndex);
      if (review.is_unplanned) unplannedIndex += 1;
      return {
        id: clientId,
        aipActivityId: review.aip_activity_id,
        fromAIP: Boolean(review.aip_activity_id),
        name: review.aip_activity?.activity_name ?? "",
        implementationPeriod: review.aip_activity?.implementation_period ?? "",
        complied: review.complied,
        actualTasksConducted: review.actual_tasks_conducted ?? "",
        contributoryIndicators: review.contributory_performance_indicators ??
          "",
        movsExpectedOutputs: review.movs_expected_outputs ?? "",
        adjustments: review.adjustments ?? "",
        isUnplanned: review.is_unplanned ?? false,
        physicalTarget: review.physical_target,
        financialTarget: review.financial_target,
        physicalAccomplished: review.physical_accomplished,
        financialAccomplished: review.financial_accomplished,
        actionsToAddressGap: review.actions_to_address_gap ?? "",
      };
    }),
    factors: factorsMap,
    comments: comments.map(serializePirComment),
  };
}

async function getClusterScopedPir(ref: string, clusterId: number) {
  const pir = await prisma.pIR.findUnique({
    where: documentWhereFromRef(ref),
    include: {
      aip: {
        include: {
          program: true,
          school: { include: { cluster: true } },
        },
      },
      created_by: {
        select: {
          name: true,
          first_name: true,
          middle_initial: true,
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
  if (!pir || pir.deleted_at || pir.status === "Draft") return null;
  if (pir.aip.school?.cluster_id !== clusterId) return null;
  return pir;
}

clusterConsultantRoutes.get(
  "/overview",
  adminAsyncHandler(
    "Cluster Consultant overview failed",
    "Failed to fetch cluster overview",
    async (c) => {
      const tokenUser = await requireClusterConsultant(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const where = clusterPirWhere(tokenUser.cluster_id, c);
      const cluster = await prisma.cluster.findUnique({
        where: { id: tokenUser.cluster_id },
        select: { id: true, name: true, cluster_number: true, logo: true },
      });
      if (!cluster) return c.json({ error: "Assigned cluster not found" }, 403);

      const [schools, pirs, recentPirs] = await Promise.all([
        prisma.school.findMany({
          where: { cluster_id: tokenUser.cluster_id },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.pIR.findMany({
          where,
          select: {
            id: true,
            status: true,
            quarter: true,
            created_at: true,
            aip: {
              select: {
                school_id: true,
                year: true,
                school: { select: { id: true, name: true } },
                program: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { created_at: "desc" },
        }),
        prisma.pIR.findMany({
          where,
          take: 8,
          orderBy: { created_at: "desc" },
          include: {
            aip: { include: { program: true, school: true } },
            created_by: {
              select: {
                name: true,
                first_name: true,
                middle_initial: true,
                last_name: true,
                email: true,
              },
            },
          },
        }),
      ]);

      const pirsBySchool = new Map<number, any[]>();
      for (const pir of pirs) {
        const schoolId = pir.aip.school_id;
        if (!schoolId) continue;
        if (!pirsBySchool.has(schoolId)) pirsBySchool.set(schoolId, []);
        pirsBySchool.get(schoolId)!.push(pir);
      }

      return c.json({
        cluster,
        schoolCount: schools.length,
        pirCount: pirs.length,
        needsRevisionCount: pirs.filter((pir) =>
          pir.status === "Needs Revision"
        ).length,
        approvedCount: pirs.filter((pir) => pir.status === "Approved").length,
        pendingReviewCount:
          pirs.filter((pir) => PENDING_REVIEW_STATUSES.includes(pir.status))
            .length,
        recentPirs: recentPirs.map((pir) => serializePirListItem(pir)),
        schoolCompletion: schools.map((school) => {
          const schoolPirs = pirsBySchool.get(school.id) ?? [];
          return {
            schoolId: school.id,
            school: school.name,
            pirCount: schoolPirs.length,
            approvedCount: schoolPirs.filter((pir) => pir.status === "Approved")
              .length,
            needsRevisionCount: schoolPirs.filter((pir) =>
              pir.status === "Needs Revision"
            ).length,
            latestSubmittedAt: schoolPirs[0]?.created_at ?? null,
          };
        }),
      });
    },
  ),
);

clusterConsultantRoutes.get(
  "/pirs",
  adminAsyncHandler(
    "Cluster Consultant PIR list failed",
    "Failed to fetch PIRs",
    async (c) => {
      const tokenUser = await requireClusterConsultant(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pirs = await prisma.pIR.findMany({
        where: clusterPirWhere(tokenUser.cluster_id, c),
        orderBy: { created_at: "desc" },
        take: 200,
        include: {
          aip: { include: { program: true, school: true } },
          created_by: {
            select: {
              name: true,
              first_name: true,
              middle_initial: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      const items = await Promise.all(
        pirs.map(async (pir) => {
          const commentCount = await (prisma as any).pIRComment.count({
            where: { pir_id: pir.id, author_user_id: tokenUser.id },
          });
          return serializePirListItem(pir, commentCount);
        }),
      );

      return c.json(items);
    },
  ),
);

clusterConsultantRoutes.get(
  "/pirs/:id",
  adminAsyncHandler(
    "Cluster Consultant PIR detail failed",
    "Failed to fetch PIR",
    async (c) => {
      const tokenUser = await requireClusterConsultant(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pir = await getClusterScopedPir(
        c.req.param("id") ?? "",
        tokenUser.cluster_id,
      );
      if (!pir) return c.json({ error: "PIR not found" }, 404);
      const comments = await (prisma as any).pIRComment.findMany({
        where: { pir_id: pir.id, author_user_id: tokenUser.id },
        orderBy: { created_at: "asc" },
      });

      return c.json(serializePirDetail(pir, comments));
    },
  ),
);

clusterConsultantRoutes.get(
  "/pirs/:id/comments",
  adminAsyncHandler(
    "Cluster Consultant PIR comments failed",
    "Failed to fetch PIR comments",
    async (c) => {
      const tokenUser = await requireClusterConsultant(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const pir = await getClusterScopedPir(
        c.req.param("id") ?? "",
        tokenUser.cluster_id,
      );
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      const comments = await (prisma as any).pIRComment.findMany({
        where: { pir_id: pir.id, author_user_id: tokenUser.id },
        orderBy: { created_at: "asc" },
      });
      return c.json(comments.map(serializePirComment));
    },
  ),
);

clusterConsultantRoutes.post(
  "/pirs/:id/comments",
  adminAsyncHandler(
    "Cluster Consultant PIR comment failed",
    "Failed to add PIR comment",
    async (c) => {
      const tokenUser = await requireClusterConsultant(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const body = sanitizeObject(await c.req.json().catch(() => ({}))) as any;
      const scope = sanitizeString(body.scope).trim();
      const category = sanitizeString(body.category).trim();
      const rawSectionKey = sanitizeString(body.section_key ?? body.sectionKey)
        .trim();
      const sectionKey = scope === "section" ? rawSectionKey : null;
      const commentBody = sanitizeString(body.body).trim();

      if (!VALID_SCOPES.has(scope)) {
        return c.json({ error: "Invalid comment scope" }, 400);
      }
      if (!VALID_CATEGORIES.has(category)) {
        return c.json({ error: "Invalid comment category" }, 400);
      }
      if (
        scope === "section" &&
        (!sectionKey || !VALID_SECTION_KEYS.has(sectionKey))
      ) {
        return c.json({
          error: "A valid section_key is required for section comments",
        }, 400);
      }
      if (!commentBody) {
        return c.json({ error: "Comment body is required" }, 400);
      }
      if (commentBody.length > MAX_TEXT_LENGTH) {
        return c.json({
          error: `Comment cannot exceed ${MAX_TEXT_LENGTH} characters`,
        }, 400);
      }

      const pir = await getClusterScopedPir(
        c.req.param("id") ?? "",
        tokenUser.cluster_id,
      );
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      const comment = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(pir),
        async (tx) => {
          const lockedPir = await tx.pIR.findUnique({
            where: { id: pir.id },
            include: {
              aip: { include: { program: true, school: true } },
            },
          });
          if (
            !lockedPir || lockedPir.deleted_at || lockedPir.status === "Draft"
          ) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }
          if (lockedPir.aip.school?.cluster_id !== tokenUser.cluster_id) {
            throw new HttpError(403, "Forbidden", "FORBIDDEN");
          }

          const created = await (tx as any).pIRComment.create({
            data: {
              pir_id: pir.id,
              author_user_id: tokenUser.id,
              scope,
              section_key: sectionKey,
              category,
              body: commentBody,
            },
          });

          await (tx.pIR as any).update({
            where: { id: pir.id },
            data: {
              status: "Needs Revision",
              active_reviewer_id: null,
              active_review_started_at: null,
            },
          });

          return {
            created,
            submitterId: lockedPir.created_by_user_id,
            programTitle: lockedPir.aip.program.title,
            quarter: lockedPir.quarter,
          };
        },
      );

      if (comment.submitterId) {
        const notification = await prisma.notification.create({
          data: {
            user_id: comment.submitterId,
            title: "PIR Needs Revision",
            message:
              `A Cluster Consultant left remarks on your PIR for ${comment.programTitle} (${comment.quarter}).`,
            type: "needs_revision",
            entity_id: pir.id,
            entity_type: "pir",
          },
        });
        pushNotification(notification);
      }

      await writeAuditLog(
        tokenUser.id,
        "cluster_consultant_commented_pir",
        "PIR",
        pir.id,
        {
          scope,
          section_key: sectionKey,
          category,
          cluster_id: tokenUser.cluster_id,
          comment_id: comment.created.id,
        },
        { ctx: c },
      );

      return c.json(serializePirComment(comment.created), 201);
    },
  ),
);

export default clusterConsultantRoutes;
