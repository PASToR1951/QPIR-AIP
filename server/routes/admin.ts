import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import bcrypt from "bcrypt";
import * as XLSX from "xlsx";
import { getCESRoleForDivisionPIR, CES_ROLES } from "../lib/routing.ts";
import { getUserFromToken, TokenPayload } from "../lib/auth.ts";
import { logger } from "../lib/logger.ts";
import { pushNotification, pushNotifications } from "../lib/notifStream.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";
import { sanitizeObject } from "../lib/sanitize.ts";

const adminRoutes = new Hono();

import type { Context } from "hono";

function requireAdmin(c: Context | string | undefined): TokenPayload | null {
  const user = getUserFromToken(c);
  if (!user || user.role !== "Admin") return null;
  return user;
}

function requireCES(c: Context | string | undefined): TokenPayload | null {
  const user = getUserFromToken(c);
  if (!user || !(CES_ROLES as readonly string[]).includes(user.role)) return null;
  return user;
}

function requireClusterHead(c: Context | string | undefined): TokenPayload | null {
  const user = getUserFromToken(c);
  if (!user || user.role !== "Cluster Coordinator") return null;
  return user;
}

async function writeAuditLog(
  adminId: number,
  action: string,
  entityType: string,
  entityId: number,
  // deno-lint-ignore no-explicit-any
  details: Record<string, unknown>
) {
  await prisma.auditLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { admin_id: adminId, action, entity_type: entityType, entity_id: entityId, details: details as any },
  });
}

function buildSubmittedBy(u: {
  role?: string | null;
  first_name?: string | null;
  middle_initial?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!u) return "—";
  if (u.role === "Division Personnel" && u.first_name && u.last_name) {
    const mi = u.middle_initial ? ` ${u.middle_initial}.` : "";
    return `${u.first_name}${mi} ${u.last_name}`;
  }
  return u.name ?? u.email ?? "—";
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  return "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
}

function toXLSX(rows: Record<string, unknown>[], sheetName = "Sheet1"): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Wrap every admin handler with auth check
// GET /admin/pirs — list submitted PIRs (Admin + CES + Cluster Coordinator)
adminRoutes.get('/pirs', async (c) => {
  const tokenUser = getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);
  const readableRoles = ['Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator'];
  if (!readableRoles.includes(tokenUser.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const quarter = c.req.query('quarter');
  const pirs = await prisma.pIR.findMany({
    where: {
      status: { not: 'Draft' },
      ...(quarter ? { quarter } : {}),
    },
    include: {
      aip: { include: { program: true, school: true } },
      created_by: { select: { name: true, first_name: true, last_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return c.json(pirs.map((p: any) => ({
    id: p.id,
    quarter: p.quarter,
    status: p.status,
    program: p.aip.program.title,
    school: p.aip.school?.name ?? 'Division',
    owner: p.program_owner,
    submittedAt: p.created_at,
    submittedBy: p.created_by
      ? (p.created_by.name ?? [p.created_by.first_name, p.created_by.last_name].filter(Boolean).join(' '))
      : null,
  })));
});

// GET /admin/pirs/:id — single PIR with full data (Admin + Reviewer + CES + Cluster Coordinator)
adminRoutes.get('/pirs/:id', async (c) => {
  const tokenUser = getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);
  const readableRoles = ['Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator'];
  if (!readableRoles.includes(tokenUser.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const pirId = safeParseInt(c.req.param('id'), 0);
  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: {
      aip: { include: { program: true, school: true } },
      activity_reviews: { include: { aip_activity: true } },
      factors: true,
      ces_reviewer: { select: { name: true, role: true } },
    },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);

  const factorsMap: Record<string, any> = {};
  for (const f of pir.factors) {
    factorsMap[f.factor_type] = {
      facilitating: f.facilitating_factors,
      hindering: f.hindering_factors,
      recommendations: (f as any).recommendations ?? '',
    };
  }

  return c.json({
    id: pir.id,
    quarter: pir.quarter,
    status: pir.status,
    program: (pir as any).aip.program.title,
    school: (pir as any).aip.school?.name ?? 'Division',
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
    activities: pir.activity_reviews.map((r: any) => ({
      id: r.id,
      name: r.aip_activity?.activity_name ?? '',
      implementation_period: r.aip_activity?.implementation_period ?? '',
      complied: r.complied,
      actualTasksConducted: r.actual_tasks_conducted ?? '',
      contributoryIndicators: r.contributory_performance_indicators ?? '',
      movsExpectedOutputs: r.movs_expected_outputs ?? '',
      adjustments: r.adjustments ?? '',
      isUnplanned: r.is_unplanned ?? false,
      physTarget: r.physical_target,
      finTarget: r.financial_target,
      physAcc: r.physical_accomplished,
      finAcc: r.financial_accomplished,
      actions: r.actions_to_address_gap ?? '',
      adminNotes: r.admin_notes ?? '',
    })),
    factors: factorsMap,
  });
});

// ==========================================
// CES REVIEW ROUTES (before admin middleware)
// ==========================================

adminRoutes.get('/ces/pirs', async (c) => {
  const tokenUser = requireCES(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const quarter = c.req.query('quarter');

  // CES-CID sees: division PIRs with CID division + Cluster Coordinator's own PIRs (no school_id)
  const cesFilter: Record<string, any> = {
    'CES-SGOD': { aip: { school_id: null, program: { division: 'SGOD' } } },
    'CES-ASDS': { aip: { school_id: null, program: { division: 'OSDS' } } },
    'CES-CID':  { aip: { school_id: null }, OR: [
      { aip: { program: { division: 'CID' } } },
      { aip: { created_by: { role: 'Cluster Coordinator' } } },
    ]},
  };

  const roleFilter = cesFilter[tokenUser.role] ?? {};

  const pirs = await prisma.pIR.findMany({
    where: {
      status: { in: ['For CES Review', 'Under Review'] },
      ...roleFilter,
      ...(quarter ? { quarter } : {}),
    },
    include: {
      aip: { include: { program: true, school: true } },
      created_by: { select: { name: true, first_name: true, last_name: true, email: true } },
      active_reviewer: { select: { name: true, first_name: true, last_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return c.json(pirs.map((p: any) => ({
    id: p.id,
    quarter: p.quarter,
    status: p.status,
    program: p.aip.program.title,
    school: p.aip.school?.name ?? 'Division',
    owner: p.program_owner,
    functionalDivision: p.functional_division,
    submittedAt: p.created_at,
    submittedBy: buildSubmittedBy(p.created_by),
    activeReviewerName: p.active_reviewer ? buildSubmittedBy(p.active_reviewer) : null,
    activeReviewStartedAt: p.active_review_started_at ?? null,
  })));
});

adminRoutes.post('/ces/pirs/:id/start-review', async (c) => {
  const tokenUser = requireCES(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if (!['For CES Review', 'Under Review'].includes((pir as any).status)) {
    return c.json({ error: 'PIR is not in a reviewable state' }, 409);
  }
  const updated = await prisma.pIR.updateMany({
    where: { id: pirId, active_reviewer_id: null },
    data: {
      status: 'Under Review',
      active_reviewer_id: tokenUser.id,
      active_review_started_at: new Date(),
    },
  });
  if (updated.count === 0) return c.json({ error: 'PIR is already under review' }, 409);
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Under Review',
        message: `Your PIR for ${(pir as any).aip.program.title} (${(pir as any).quarter}) is now under review.`,
        type: 'under_review',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }
  await writeAuditLog(tokenUser.id, 'started_pir_review', 'PIR', pirId, {});
  return c.json({ success: true });
});

adminRoutes.post('/ces/pirs/:id/update-recommendations', async (c) => {
  const tokenUser = requireCES(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const { recommendations } = sanitizeObject(await c.req.json());
  if (!recommendations || typeof recommendations !== 'object') {
    return c.json({ error: 'Invalid recommendations data' }, 400);
  }

  const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);

  for (const [factorType, text] of Object.entries(recommendations)) {
    if (typeof text !== 'string') continue;
    await prisma.pIRFactor.updateMany({
      where: { pir_id: pirId, factor_type: factorType },
      data: { recommendations: text },
    });
  }

  await writeAuditLog(tokenUser.id, 'updated_pir_recommendations', 'PIR', pirId, {});
  return c.json({ success: true });
});

adminRoutes.post('/ces/pirs/:id/note', async (c) => {
  const tokenUser = requireCES(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const { ces_remarks } = sanitizeObject(await c.req.json());
  if (ces_remarks && ces_remarks.length > 5000) {
    return c.json({ error: 'Remarks cannot exceed 5000 characters' }, 400);
  }

  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true, school: true } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if (!['For CES Review', 'Under Review'].includes((pir as any).status)) {
    return c.json({ error: 'PIR is not pending CES review' }, 409);
  }

  const updated = await prisma.pIR.update({
    where: { id: pirId },
    data: {
      status: 'Approved',
      active_reviewer_id: null,
      active_review_started_at: null,
      ces_reviewer_id: tokenUser.id,
      ces_noted_at: new Date(),
      ces_remarks: ces_remarks ?? null,
    },
  });

  const programTitle = (pir as any).aip.program.title;

  // Notify the submitter
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Approved',
        message: `Your PIR for ${programTitle} (${(pir as any).quarter}) has been noted and approved by CES.`,
        type: 'approved',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }

  await writeAuditLog(tokenUser.id, 'ces_noted_pir', 'PIR', pirId, { ces_remarks: ces_remarks ?? null });
  return c.json({ success: true, pir: updated });
});

adminRoutes.post('/ces/pirs/:id/return', async (c) => {
  const tokenUser = requireCES(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const { ces_remarks } = sanitizeObject(await c.req.json());
  if (ces_remarks && ces_remarks.length > 5000) {
    return c.json({ error: 'Remarks cannot exceed 5000 characters' }, 400);
  }

  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true, school: true } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if (!['For CES Review', 'Under Review'].includes((pir as any).status)) {
    return c.json({ error: 'PIR is not pending CES review' }, 409);
  }

  await prisma.pIR.update({
    where: { id: pirId },
    data: {
      status: 'Returned',
      active_reviewer_id: null,
      active_review_started_at: null,
      ces_reviewer_id: tokenUser.id,
      ces_noted_at: new Date(),
      ces_remarks: ces_remarks ?? null,
    },
  });

  const programTitle = (pir as any).aip.program.title;
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Returned by CES',
        message: `Your PIR for ${programTitle} (${(pir as any).quarter}) was returned by CES.${ces_remarks ? ` Feedback: ${ces_remarks}` : ''}`,
        type: 'returned',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }

  await writeAuditLog(tokenUser.id, 'ces_returned_pir', 'PIR', pirId, { ces_remarks: ces_remarks ?? null });
  return c.json({ success: true });
});

// ==========================================
// CLUSTER HEAD REVIEW ROUTES (before admin middleware)
// ==========================================

adminRoutes.get('/cluster-head/pirs', async (c) => {
  const tokenUser = requireClusterHead(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const quarter = c.req.query('quarter');
  const pirs = await prisma.pIR.findMany({
    where: {
      status: { in: ['For Cluster Head Review', 'Under Review'] },
      aip: { school: { cluster_id: tokenUser.cluster_id ?? -1 } },
      ...(quarter ? { quarter } : {}),
    },
    include: {
      aip: { include: { program: true, school: { include: { cluster: true } } } },
      created_by: { select: { name: true, first_name: true, last_name: true, email: true } },
      active_reviewer: { select: { name: true, first_name: true, last_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return c.json(pirs.map((p: any) => ({
    id: p.id,
    quarter: p.quarter,
    status: p.status,
    program: p.aip.program.title,
    school: p.aip.school?.name ?? '—',
    cluster: p.aip.school?.cluster ? `Cluster ${p.aip.school.cluster.cluster_number}` : '—',
    owner: p.program_owner,
    submittedAt: p.created_at,
    submittedBy: buildSubmittedBy(p.created_by),
    activeReviewerName: p.active_reviewer ? buildSubmittedBy(p.active_reviewer) : null,
    activeReviewStartedAt: p.active_review_started_at ?? null,
  })));
});

adminRoutes.post('/cluster-head/pirs/:id/start-review', async (c) => {
  const tokenUser = requireClusterHead(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true, school: true } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if (!['For Cluster Head Review', 'Under Review'].includes((pir as any).status)) {
    return c.json({ error: 'PIR is not in a reviewable state' }, 409);
  }
  if ((pir as any).aip.school?.cluster_id !== tokenUser.cluster_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const updated = await prisma.pIR.updateMany({
    where: { id: pirId, active_reviewer_id: null },
    data: {
      status: 'Under Review',
      active_reviewer_id: tokenUser.id,
      active_review_started_at: new Date(),
    },
  });
  if (updated.count === 0) return c.json({ error: 'PIR is already under review' }, 409);
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Under Review',
        message: `Your PIR for ${(pir as any).aip.program.title} (${(pir as any).quarter}) is now under review.`,
        type: 'under_review',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }
  await writeAuditLog(tokenUser.id, 'started_pir_review', 'PIR', pirId, {});
  return c.json({ success: true });
});

adminRoutes.post('/cluster-head/pirs/:id/note', async (c) => {
  const tokenUser = requireClusterHead(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const { remarks } = sanitizeObject(await c.req.json());
  if (remarks && remarks.length > 5000) {
    return c.json({ error: 'Remarks cannot exceed 5000 characters' }, 400);
  }

  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true, school: { include: { cluster: true } } } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if (!['For Cluster Head Review', 'Under Review'].includes((pir as any).status)) {
    return c.json({ error: 'PIR is not pending Cluster Head review' }, 409);
  }
  // Confirm this PIR belongs to the coordinator's cluster
  if ((pir as any).aip.school?.cluster_id !== tokenUser.cluster_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await prisma.pIR.update({
    where: { id: pirId },
    data: {
      status: 'Approved',
      active_reviewer_id: null,
      active_review_started_at: null,
      ces_reviewer_id: tokenUser.id,
      ces_noted_at: new Date(),
      ces_remarks: remarks ?? null,
    },
  });

  const programTitle = (pir as any).aip.program.title;
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Approved',
        message: `Your PIR for ${programTitle} (${(pir as any).quarter}) has been noted and approved by the Cluster Head.`,
        type: 'approved',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }

  await writeAuditLog(tokenUser.id, 'cluster_head_noted_pir', 'PIR', pirId, { remarks: remarks ?? null });
  return c.json({ success: true });
});

adminRoutes.post('/cluster-head/pirs/:id/return', async (c) => {
  const tokenUser = requireClusterHead(c);
  if (!tokenUser) return c.json({ error: 'Forbidden' }, 403);

  const pirId = safeParseInt(c.req.param('id'), 0);
  const { remarks } = sanitizeObject(await c.req.json());
  if (remarks && remarks.length > 5000) {
    return c.json({ error: 'Remarks cannot exceed 5000 characters' }, 400);
  }

  const pir = await prisma.pIR.findUnique({
    where: { id: pirId },
    include: { aip: { include: { program: true, school: { include: { cluster: true } } } } },
  });
  if (!pir) return c.json({ error: 'PIR not found' }, 404);
  if ((pir as any).status !== 'For Cluster Head Review') {
    return c.json({ error: 'PIR is not pending Cluster Head review' }, 409);
  }
  if ((pir as any).aip.school?.cluster_id !== tokenUser.cluster_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await prisma.pIR.update({
    where: { id: pirId },
    data: {
      status: 'Returned',
      ces_reviewer_id: tokenUser.id,
      ces_noted_at: new Date(),
      ces_remarks: remarks ?? null,
    },
  });

  const programTitle = (pir as any).aip.program.title;
  if ((pir as any).created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: (pir as any).created_by_user_id,
        title: 'PIR Returned by Cluster Head',
        message: `Your PIR for ${programTitle} (${(pir as any).quarter}) was returned by the Cluster Head.${remarks ? ` Feedback: ${remarks}` : ''}`,
        type: 'returned',
        entity_id: (pir as any).id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }

  await writeAuditLog(tokenUser.id, 'cluster_head_returned_pir', 'PIR', pirId, { remarks: remarks ?? null });
  return c.json({ success: true });
});

adminRoutes.use("*", async (c, next) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});

// ==========================================
// OVERVIEW
// ==========================================

adminRoutes.get("/overview", async (c) => {
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear(), 2020, 2100);

  // Current quarter (needed early for PIR queries)
  const month = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3);

  const quarterPrefixes: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

  const [totalSchools, totalUsers, totalPrograms, totalProgramOwners, aipCount, pirCount, pirsByQuarter, schoolsWithAIP] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.program.count(),
    prisma.user.count({ where: { is_active: true, role: "Division Personnel" } }),
    prisma.aIP.count({ where: { year, status: { not: 'Draft' } } }),
    prisma.pIR.count({ where: { status: { not: 'Draft' } } }),
    // PIR quarterly breakdown for the current year
    prisma.pIR.findMany({
      where: { aip: { year }, status: { not: 'Draft' } },
      select: { quarter: true, status: true },
    }),
    // AIP compliance: schools with at least one non-draft AIP this year
    prisma.aIP.findMany({
      where: { year, school_id: { not: null }, status: { not: 'Draft' } },
      select: { school_id: true },
      distinct: ["school_id"],
    }),
  ]);

  const aipCompliantCount = schoolsWithAIP.length;

  // Build PIR quarterly summary
  const pirQuarterly = [1, 2, 3, 4].map((q) => {
    const prefix = quarterPrefixes[q];
    const qPirs = pirsByQuarter.filter((p) => p.quarter.startsWith(prefix));
    return {
      quarter: `Q${q}`,
      submitted:    qPirs.filter((p) => p.status === "Submitted").length,
      forCESReview: qPirs.filter((p) => p.status === "For CES Review").length,
      forClusterHeadReview: qPirs.filter((p) => p.status === "For Cluster Head Review").length,
      approved:     qPirs.filter((p) => p.status === "Approved").length,
      underReview:  qPirs.filter((p) => p.status === "Under Review").length,
      returned:     qPirs.filter((p) => p.status === "Returned").length,
    };
  });

  // Current-quarter PIR counts for stat cards
  const currentQPirs = pirsByQuarter.filter((p) => p.quarter.startsWith(quarterPrefixes[currentQuarter]));
  const pirSubmittedThisQ = currentQPirs.length;
  const pirApprovedThisQ = currentQPirs.filter((p) => p.status === "Approved").length;
  const pirReturnedThisQ = currentQPirs.filter((p) => p.status === "Returned").length;

  // PIR approval rate for the year
  const pirTotalThisYear = pirsByQuarter.length;
  const pirApprovedThisYear = pirsByQuarter.filter((p) => p.status === "Approved").length;
  const pirApprovalRate = pirTotalThisYear > 0 ? Math.round((pirApprovedThisYear / pirTotalThisYear) * 100) : 0;

  // PIR accomplishment stats — physical & financial utilization rates
  const pirActivityReviews = await prisma.pIRActivityReview.findMany({
    where: { pir: { aip: { year } } },
    select: {
      physical_target: true,
      physical_accomplished: true,
      financial_target: true,
      financial_accomplished: true,
    },
  });

  let avgPhysicalRate = 0;
  let avgFinancialRate = 0;
  const reviewsWithPhysicalTarget = pirActivityReviews.filter((r) => Number(r.physical_target) > 0);
  const reviewsWithFinancialTarget = pirActivityReviews.filter((r) => Number(r.financial_target) > 0);
  if (reviewsWithPhysicalTarget.length > 0) {
    const totalPhysicalRate = reviewsWithPhysicalTarget.reduce(
      (sum, r) => sum + (Number(r.physical_accomplished) / Number(r.physical_target)) * 100, 0
    );
    avgPhysicalRate = Math.round(totalPhysicalRate / reviewsWithPhysicalTarget.length);
  }
  if (reviewsWithFinancialTarget.length > 0) {
    const totalFinancialRate = reviewsWithFinancialTarget.reduce(
      (sum, r) => sum + (Number(r.financial_accomplished) / Number(r.financial_target)) * 100, 0
    );
    avgFinancialRate = Math.round(totalFinancialRate / reviewsWithFinancialTarget.length);
  }

  // Deadline for current quarter
  const deadline = await prisma.deadline.findUnique({
    where: { year_quarter: { year, quarter: currentQuarter } },
  });
  const defaultDeadlines: Record<number, Date> = {
    1: new Date(year, 2,  31, 23, 59, 59, 999),
    2: new Date(year, 5,  30, 23, 59, 59, 999),
    3: new Date(year, 8,  30, 23, 59, 59, 999),
    4: new Date(year, 11, 31, 23, 59, 59, 999),
  };
  const deadlineDate = deadline
    ? new Date(new Date(deadline.date).setHours(23, 59, 59, 999))
    : defaultDeadlines[currentQuarter];
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Recent submissions (up to 20)
  const recentAIPs = await prisma.aIP.findMany({
    where: { status: { not: 'Draft' } },
    take: 10,
    orderBy: { created_at: "desc" },
    include: { school: true, program: true, created_by: true },
  });
  const recentPIRs = await prisma.pIR.findMany({
    where: { status: { not: 'Draft' } },
    take: 15,
    orderBy: { created_at: "desc" },
    include: { aip: { include: { school: true, program: true } }, created_by: true },
  });

  const recentSubmissions = [
    ...recentAIPs.map((a) => ({
      id: a.id,
      type: "AIP",
      school: a.school?.name ?? "Division",
      program: a.program.title,
      quarter: null,
      submitted: a.created_at,
      status: a.status,
      submittedBy: buildSubmittedBy(a.created_by),
    })),
    ...recentPIRs.map((p) => ({
      id: p.id,
      type: "PIR",
      school: p.aip.school?.name ?? "Division",
      program: p.aip.program.title,
      quarter: p.quarter,
      submitted: p.created_at,
      status: p.status,
      submittedBy: buildSubmittedBy(p.created_by),
    })),
  ]
    .sort((a, b) => {
      // PIRs first, then by date descending
      if (a.type !== b.type) return a.type === "PIR" ? -1 : 1;
      return new Date(b.submitted).getTime() - new Date(a.submitted).getTime();
    })
    .slice(0, 20);

  // Cluster data for both AIP compliance and PIR status heatmaps
  const currentQPrefix = quarterPrefixes[currentQuarter];
  const [clusters, allPrograms] = await Promise.all([
    prisma.cluster.findMany({
      include: {
        schools: {
          include: {
            aips: {
              where: { year, status: { not: 'Draft' } },
              select: {
                id: true,
                pirs: { where: { status: { not: 'Draft' } }, select: { id: true, status: true, quarter: true } },
              },
            },
          },
        },
      },
    }),
    prisma.program.findMany({
      where: { school_level_requirement: { not: 'Division' } },
      select: { id: true, school_level_requirement: true, restricted_schools: { select: { id: true } } },
    }),
  ]);

  const clusterCompliance = clusters.map((cl) => {
    const total = cl.schools.length;
    const compliant = cl.schools.filter((s) => s.aips.length > 0).length;
    return {
      id: cl.id,
      name: cl.name,
      cluster_number: cl.cluster_number,
      total,
      compliant,
      pct: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
  });

  // PIR submission status by cluster for the current quarter.
  // Denominator = programs each school is EXPECTED to implement (based on school level
  // and program requirements), not just AIPs that have already been filed.
  const getExpectedProgramCount = (schoolId: number, schoolLevel: string): number =>
    allPrograms.filter((p) => {
      if (p.school_level_requirement === 'Select Schools') {
        return p.restricted_schools.some((r) => r.id === schoolId);
      }
      const levelMatch =
        p.school_level_requirement === 'Both' ||
        p.school_level_requirement === schoolLevel ||
        (schoolLevel === 'Both' && ['Elementary', 'Secondary'].includes(p.school_level_requirement));
      if (!levelMatch) return false;
      if (p.restricted_schools.length > 0) return p.restricted_schools.some((r) => r.id === schoolId);
      return true;
    }).length;

  const pirClusterStatus = clusters.map((cl) => {
    const totalSchools = cl.schools.length;

    // School-level breakdown for drill-down
    const schools = cl.schools.map((s) => {
      const expectedPrograms = getExpectedProgramCount(s.id, s.level);
      const schoolPirs = s.aips.flatMap((a) =>
        a.pirs.filter((p) => p.quarter.startsWith(currentQPrefix))
      );
      return {
        id: s.id,
        name: s.name,
        totalAips: expectedPrograms,
        submitted: schoolPirs.length,
        approved: schoolPirs.filter((p) => p.status === "Approved").length,
        pct: expectedPrograms > 0 ? Math.round((schoolPirs.length / expectedPrograms) * 100) : 0,
      };
    }).sort((a, b) => a.pct - b.pct); // worst first so admins see who needs attention

    const totalAips = schools.reduce((sum, s) => sum + s.totalAips, 0);
    const submittedAips = schools.reduce((sum, s) => sum + s.submitted, 0);
    const approvedAips = schools.reduce((sum, s) => sum + s.approved, 0);

    return {
      id: cl.id,
      name: cl.name,
      cluster_number: cl.cluster_number,
      totalSchools,
      totalAips,
      submittedAips,
      approvedAips,
      pct: totalAips > 0 ? Math.round((submittedAips / totalAips) * 100) : 0,
      schools,
    };
  });

  return c.json({
    stats: {
      totalSchools,
      totalUsers,
      totalPrograms,
      totalProgramOwners,
      aipCompliantCount,
      aipCompliancePct: totalSchools > 0 ? Math.round((aipCompliantCount / totalSchools) * 100) : 0,
      pirCount,
      pirSubmittedThisQ,
      pirApprovedThisQ,
      pirReturnedThisQ,
      pirApprovalRate,
      pirTotalThisYear,
      pirApprovedThisYear,
      avgPhysicalRate,
      avgFinancialRate,
      totalActivitiesReviewed: pirActivityReviews.length,
      currentQuarter,
      deadlineDate,
      daysLeft,
      year,
    },
    recentSubmissions,
    clusterCompliance,
    pirQuarterly,
    pirClusterStatus,
  });
});

// ==========================================
// SUBMISSIONS
// ==========================================

adminRoutes.get("/submissions", async (c) => {
  try {
  const q = (key: string) => c.req.query(key);
  const type = q("type"); // "aip" | "pir" | undefined
  const clusterId = q("cluster") ? safeParseInt(q("cluster"), 0) : undefined;
  const schoolId = q("school") ? safeParseInt(q("school"), 0) : undefined;
  const programId = q("program") ? safeParseInt(q("program"), 0) : undefined;
  const quarter = q("quarter");
  const year = q("year") ? safeParseInt(q("year"), 0) : undefined;
  const status = q("status");
  const page = safeParseInt(q("page"), 1);
  const limit = Math.min(100, safeParseInt(q("limit"), 25));
  const skip = (page - 1) * limit;

  const schoolFilter = schoolId
    ? { id: schoolId }
    : clusterId
    ? { cluster_id: clusterId }
    : undefined;

  // Always build both filter objects (needed for counts regardless of active tab)
  const aipWhere = {
    status: { not: 'Draft' as const },
    ...(year && { year }),
    ...(programId && { program_id: programId }),
    ...(status && { status }),
    ...(schoolFilter && { school: schoolFilter }),
  };
  const pirWhere = {
    status: { not: 'Draft' as const },
    ...(quarter && { quarter: { contains: `${quarter}` } }),
    ...(status && { status }),
    aip: {
      ...(year && { year }),
      ...(programId && { program_id: programId }),
      ...(schoolFilter && { school: schoolFilter }),
    },
  };

  // Always count both so tab badges stay correct regardless of which tab is active
  const [aipTotal, pirTotal] = await Promise.all([
    prisma.aIP.count({ where: aipWhere }),
    prisma.pIR.count({ where: pirWhere }),
  ]);

  // Fetch full records only for the active tab
  let aips: unknown[] = [];
  if (!type || type === "aip" || type === "all") {
    aips = await prisma.aIP.findMany({
      where: aipWhere,
      skip: type === "aip" ? skip : 0,
      take: type === "aip" ? limit : 100,
      orderBy: { created_at: "desc" },
      include: { school: { include: { cluster: true } }, program: true, created_by: true },
    });
  }

  let pirs: unknown[] = [];
  if (!type || type === "pir" || type === "all") {
    pirs = await prisma.pIR.findMany({
      where: pirWhere,
      skip: type === "pir" ? skip : 0,
      take: type === "pir" ? limit : 100,
      orderBy: { created_at: "desc" },
      include: {
        aip: { include: { school: { include: { cluster: true } }, program: true } },
        created_by: true,
      },
    });
  }

  const normalizedAIPs = (aips as Record<string, unknown>[]).map((a: Record<string, unknown>) => {
    const aip = a as {
      id: number; status: string; year: number; created_at: Date;
      school?: { id: number; name: string; cluster?: { id: number; cluster_number: number; name: string } } | null;
      program: { id: number; title: string };
      created_by?: { role?: string | null; name?: string | null; first_name?: string | null; middle_initial?: string | null; last_name?: string | null; email?: string } | null;
    };
    return {
      id: aip.id, type: "AIP", status: aip.status, year: aip.year,
      quarter: null, schoolId: aip.school?.id ?? null,
      school: aip.school?.name ?? "Division",
      cluster: aip.school?.cluster ? `Cluster ${aip.school.cluster.cluster_number}` : "—",
      clusterId: aip.school?.cluster?.id ?? null,
      program: aip.program.title, programId: aip.program.id,
      dateSubmitted: aip.created_at,
      submittedBy: buildSubmittedBy(aip.created_by),
    };
  });

  const normalizedPIRs = (pirs as Record<string, unknown>[]).map((p: Record<string, unknown>) => {
    const pir = p as {
      id: number; status: string; quarter: string; created_at: Date;
      remarks?: string | null;
      aip: {
        year: number;
        school?: { id: number; name: string; cluster?: { id: number; cluster_number: number; name: string } } | null;
        program: { id: number; title: string };
      };
      created_by?: { role?: string | null; name?: string | null; first_name?: string | null; middle_initial?: string | null; last_name?: string | null; email?: string } | null;
    };
    return {
      id: pir.id, type: "PIR", status: pir.status, year: pir.aip.year,
      quarter: pir.quarter, schoolId: pir.aip.school?.id ?? null,
      school: pir.aip.school?.name ?? "Division",
      cluster: pir.aip.school?.cluster ? `Cluster ${pir.aip.school.cluster.cluster_number}` : "—",
      clusterId: pir.aip.school?.cluster?.id ?? null,
      program: pir.aip.program.title, programId: pir.aip.program.id,
      dateSubmitted: pir.created_at,
      submittedBy: buildSubmittedBy(pir.created_by),
      has_remarks: !!(pir.remarks && pir.remarks.trim()),
    };
  });

  const combined = [...normalizedAIPs, ...normalizedPIRs].sort(
    (a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
  );

  const total = type === "aip" ? aipTotal : type === "pir" ? pirTotal : aipTotal + pirTotal;

  return c.json({
    data: type === "all" || (!type) ? combined.slice(skip, skip + limit) : combined,
    total,
    aipTotal,
    pirTotal,
    page,
    totalPages: Math.ceil(total / limit),
  });
  } catch (e: unknown) {
    logger.error("GET /submissions error", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

adminRoutes.get("/submissions/export", async (c) => {
  const exporter = getUserFromToken(c);
  if (!exporter) return c.json({ error: "Unauthorized" }, 401);

  const format = c.req.query("format") || "csv";
  const type = c.req.query("type");
  const year = c.req.query("year") ? safeParseInt(c.req.query("year"), 0) : undefined;
  const status = c.req.query("status");

  const aips = (!type || type === "aip" || type === "all")
    ? await prisma.aIP.findMany({
        where: { status: { not: 'Draft' }, ...(year && { year }), ...(status && { status }) },
        include: { school: { include: { cluster: true } }, program: true, created_by: true },
        orderBy: { created_at: "desc" },
      })
    : [];

  const pirs = (!type || type === "pir" || type === "all")
    ? await prisma.pIR.findMany({
        where: { status: { not: 'Draft' }, ...(status && { status }), aip: { ...(year && { year }) } },
        include: { aip: { include: { school: { include: { cluster: true } }, program: true } }, created_by: true },
        orderBy: { created_at: "desc" },
      })
    : [];

  const rows = [
    ...aips.map((a) => ({
      Type: "AIP",
      School: a.school?.name ?? "Division",
      Cluster: a.school?.cluster ? `Cluster ${a.school.cluster.cluster_number}` : "—",
      Program: a.program.title,
      Year: a.year,
      Quarter: "—",
      Status: a.status,
      "Date Submitted": a.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(a.created_by),
    })),
    ...pirs.map((p) => ({
      Type: "PIR",
      School: p.aip.school?.name ?? "Division",
      Cluster: p.aip.school?.cluster ? `Cluster ${p.aip.school.cluster.cluster_number}` : "—",
      Program: p.aip.program.title,
      Year: p.aip.year,
      Quarter: p.quarter,
      Status: p.status,
      "Date Submitted": p.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(p.created_by),
    })),
  ];

  await writeAuditLog(exporter.id, "exported_submissions", "Export", 0, {
    format, type: type ?? "all", year: year ?? "all", status: status ?? "all", row_count: rows.length,
  });

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-export.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    return new Response(toXLSX(rows, "Submissions"), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="submissions-export.xlsx"`,
      },
    });
  }

  return c.json({ error: "Unsupported export format. Use 'csv' or 'xlsx'." }, 400);
});

adminRoutes.get("/submissions/:id", async (c) => {
  const id = safeParseInt(c.req.param("id"), 0);
  const type = c.req.query("type") || "aip";

  if (type === "pir") {
    const pir = await prisma.pIR.findUnique({
      where: { id },
      include: {
        aip: { include: { school: { include: { cluster: true } }, program: true, activities: true } },
        activity_reviews: { include: { aip_activity: true } },
        factors: true,
        created_by: true,
      },
    });
    if (!pir) return c.json({ error: "Not found" }, 404);

    const admin = requireAdmin(c);
    if (admin) {
      await writeAuditLog(admin.id, 'read_pir', 'PIR', pir.id, { quarter: pir.quarter });
    }

    return c.json(pir);
  }

  const aip = await prisma.aIP.findUnique({
    where: { id },
    include: { school: true, program: true, activities: true, created_by: true },
  });
  if (!aip) return c.json({ error: "Not found" }, 404);
  return c.json(aip);
});

adminRoutes.patch("/submissions/:id/status", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { type, status, feedback } = sanitizeObject(await c.req.json());

  if (!["Submitted", "Under Review", "For CES Review", "For Cluster Head Review", "Approved", "Returned"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const statusLabels: Record<string, string> = {
    "Approved":        "approved",
    "Returned":        "returned",
    "Under Review":    "under_review",
    "For CES Review":  "for_ces_review",
    "For Cluster Head Review": "for_cluster_head_review",
    "Submitted":       "submitted",
  };

  if (type === "pir") {
    const pir = await prisma.pIR.update({ where: { id }, data: { status }, include: { aip: { include: { program: true, school: true } } } });
    if (pir.created_by_user_id) {
      const schoolLabel = pir.aip.school?.name ?? "your school";
      const notifMessages: Record<string, { title: string; message: string }> = {
        "Approved":       { title: "PIR Approved",            message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel} has been approved.` },
        "Returned":       { title: "PIR Returned",            message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been returned for correction.${feedback ? ` Feedback: ${feedback}` : ""}` },
        "Under Review":   { title: "PIR Under Review",        message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) is now under review.` },
        "For CES Review": { title: "PIR Pending CES Review",  message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been sent for CES review.` },
        "For Cluster Head Review": { title: "PIR Pending Cluster Head Review", message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been sent for Cluster Head review.` },
        "Submitted":      { title: "PIR Status Updated",      message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) status has been updated to Submitted.` },
      };
      const notif = notifMessages[status];
      if (notif) {
        const created = await prisma.notification.create({
          data: { user_id: pir.created_by_user_id, title: notif.title, message: notif.message, type: statusLabels[status], entity_id: pir.id, entity_type: 'pir' },
        });
        pushNotification(created);
      }
    }
  } else {
    const aip = await prisma.aIP.update({
      where: { id },
      data: { status },
      include: { program: true, school: true },
    });
    if (aip.created_by_user_id) {
      const schoolLabel = aip.school?.name ?? "your school";
      const aipNotifMessages: Record<string, { title: string; message: string }> = {
        "Approved": { title: "AIP Approved", message: `Your AIP for ${aip.program.title} (FY ${aip.year}) from ${schoolLabel} has been approved.` },
        "Returned": { title: "AIP Returned", message: `Your AIP for ${aip.program.title} (FY ${aip.year}) has been returned for correction.${feedback ? ` Feedback: ${feedback}` : ""}` },
      };
      const aipNotif = aipNotifMessages[status];
      if (aipNotif) {
        const created = await prisma.notification.create({
          data: { user_id: aip.created_by_user_id, title: aipNotif.title, message: aipNotif.message, type: statusLabels[status], entity_id: aip.id, entity_type: 'aip' },
        });
        pushNotification(created);
      }
    }
  }

  await writeAuditLog(admin.id, `updated_${type}_status`, type === "pir" ? "PIR" : "AIP", id, {
    status,
    feedback: feedback ?? null,
  });

  return c.json({ success: true });
});

// ==========================================
// AIP EDIT REQUEST — APPROVE / DENY
// ==========================================

adminRoutes.patch('/aips/:id/approve-edit', async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  const id = safeParseInt(c.req.param('id'), 0);
  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false, status: 'Returned' },
    include: { program: true, school: true },
  });
  if (aip.created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: aip.created_by_user_id,
        title: 'Edit Request Approved',
        message: `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been approved. You may now edit and resubmit.`,
        type: 'aip_edit_approved',
        entity_id: aip.id,
        entity_type: 'aip',
      },
    });
    pushNotification(notif);
  }
  await writeAuditLog(admin.id, 'approved_aip_edit_request', 'AIP', id, {});
  return c.json({ success: true });
});

adminRoutes.patch('/aips/:id/deny-edit', async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  const id = safeParseInt(c.req.param('id'), 0);
  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false },
    include: { program: true, school: true },
  });
  if (aip.created_by_user_id) {
    const notif = await prisma.notification.create({
      data: {
        user_id: aip.created_by_user_id,
        title: 'Edit Request Denied',
        message: `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been denied.`,
        type: 'aip_edit_denied',
        entity_id: aip.id,
        entity_type: 'aip',
      },
    });
    pushNotification(notif);
  }
  await writeAuditLog(admin.id, 'denied_aip_edit_request', 'AIP', id, {});
  return c.json({ success: true });
});

// ==========================================
// PIR REMARKS
// ==========================================

adminRoutes.patch("/pirs/:id/remarks", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { remarks } = sanitizeObject(await c.req.json());

  if (typeof remarks !== "string") {
    return c.json({ error: "remarks must be a string" }, 400);
  }
  if (remarks.length > 5000) {
    return c.json({ error: 'Remarks cannot exceed 5000 characters' }, 400);
  }

  const pir = await prisma.pIR.update({
    where: { id },
    data: { remarks },
    include: { aip: { include: { program: true, school: true } } },
  });

  if (pir.created_by_user_id && remarks.trim()) {
    const schoolLabel = pir.aip.school?.name ?? "your school";
    const notif = await prisma.notification.create({
      data: {
        user_id: pir.created_by_user_id,
        title: "Remarks Added to Your PIR",
        message: `An admin has added remarks to your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel}.`,
        type: "remarked",
        entity_id: pir.id,
        entity_type: 'pir',
      },
    });
    pushNotification(notif);
  }

  await writeAuditLog(admin.id, "update_remarks", "PIR", id, { remarks });

  return c.json({ success: true, remarks: pir.remarks });
});

adminRoutes.patch("/pirs/:id/presented", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);

  const pir = await prisma.pIR.findUnique({ where: { id } });
  if (!pir) return c.json({ error: "PIR not found" }, 404);

  const updated = await prisma.pIR.update({
    where: { id },
    data: { presented: !pir.presented },
  });

  await writeAuditLog(admin.id, "toggle_presented", "PIR", id, { presented: updated.presented });

  return c.json({ success: true, presented: updated.presented });
});

adminRoutes.patch("/pirs/:id/activity-notes", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const pirId = safeParseInt(c.req.param("id"), 0);
  const { activity_review_id, notes } = sanitizeObject(await c.req.json());

  if (!activity_review_id || typeof notes !== "string") {
    return c.json({ error: "activity_review_id and notes are required" }, 400);
  }
  if (notes.length > 5000) {
    return c.json({ error: 'Notes cannot exceed 5000 characters' }, 400);
  }

  await prisma.pIRActivityReview.update({
    where: { id: activity_review_id },
    data: { admin_notes: notes },
  });

  await writeAuditLog(admin.id, "update_activity_notes", "PIR", pirId, {
    activity_review_id,
    notes,
  });

  return c.json({ ok: true });
});

// ==========================================
// USERS
// ==========================================

adminRoutes.get("/users", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const search = c.req.query("search");
  const role = c.req.query("role");
  const status = c.req.query("status");

  const [users, allPrograms] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(role && role !== "All" && { role }),
        ...(status === "active" && { is_active: true }),
        ...(status === "disabled" && { is_active: false }),
        ...(search && {
          OR: [
            { name:       { contains: search, mode: "insensitive" } },
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name:  { contains: search, mode: "insensitive" } },
            { email:      { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { school: { include: { cluster: true } }, programs: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.program.findMany({
      where: { school_level_requirement: { not: "Division" } },
      select: { id: true, title: true, school_level_requirement: true, restricted_schools: { select: { id: true } } },
      orderBy: { title: "asc" },
    }),
  ]);

  return c.json(
    users.map((u) => {
      let programs;
      if (u.role === "School" && u.school) {
        const sl = u.school.level; // "Elementary" | "Secondary" | "Both"
        const schoolId = u.school.id;
        programs = allPrograms
          .filter(p => {
            const restricted = p.restricted_schools;
            // "Select Schools" — only if this school is explicitly listed
            if (p.school_level_requirement === "Select Schools") {
              return restricted.some(s => s.id === schoolId);
            }
            // Level match
            const levelMatch =
              p.school_level_requirement === "Both" ||
              p.school_level_requirement === sl ||
              (sl === "Both" && ["Elementary", "Secondary"].includes(p.school_level_requirement));
            if (!levelMatch) return false;
            // If program has restrictions, only include this school if it's listed
            if (restricted.length > 0) return restricted.some(s => s.id === schoolId);
            return true;
          })
          .map(p => ({ id: p.id, title: p.title }));
      } else {
        programs = u.programs.map(p => ({ id: p.id, title: p.title }));
      }
      return {
        id: u.id,
        name: u.name,
        first_name: u.first_name,
        middle_initial: u.middle_initial,
        last_name: u.last_name,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        school: u.school ? { id: u.school.id, name: u.school.name } : null,
        programs,
        created_at: u.created_at,
      };
    })
  );
});

adminRoutes.post("/users", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { name, first_name, middle_initial, last_name, email, password, role, school_id, cluster_id, program_ids } = sanitizeObject(await c.req.json());

  const systemRoles = ["Admin", "CES-SGOD", "CES-ASDS", "CES-CID", "Cluster Coordinator"];
  if (systemRoles.includes(role) && !name) {
    return c.json({ error: "name is required for this role" }, 400);
  }
  if (role === "Division Personnel" && (!first_name || !last_name)) {
    return c.json({ error: "first_name and last_name are required for Division Personnel" }, 400);
  }
  if (!email || !password || !role) {
    return c.json({ error: "email, password, role are required" }, 400);
  }

  function validatePassword(p: string): string | null {
    if (p.length < 8)          return 'Minimum 8 characters required';
    if (!/[A-Z]/.test(p))      return 'Must contain an uppercase letter';
    if (!/[a-z]/.test(p))      return 'Must contain a lowercase letter';
    if (!/[0-9]/.test(p))      return 'Must contain a number';
    if (!/[!@#$%^&*]/.test(p)) return 'Must contain a special character';
    return null;
  }
  const pwError = validatePassword(password);
  if (pwError) return c.json({ error: pwError }, 400);

  const cesRoles = ["CES-SGOD", "CES-ASDS", "CES-CID"];
  if (cesRoles.includes(role)) {
    const existing = await prisma.user.findFirst({ where: { role } });
    if (existing) {
      return c.json({ error: `A ${role} account already exists. Only one account per CES role is allowed.` }, 409);
    }
  }

  if (role === "Cluster Coordinator") {
    const count = await prisma.user.count({ where: { role: "Cluster Coordinator" } });
    if (count >= 10) {
      return c.json({ error: "Maximum of 10 Cluster Coordinator accounts allowed." }, 409);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          ...(name            !== undefined && { name }),
          ...(first_name      !== undefined && { first_name }),
          ...(middle_initial  !== undefined && { middle_initial }),
          ...(last_name       !== undefined && { last_name }),
          email,
          password: hashed,
          role,
          ...(school_id && { school_id }),
          ...(cluster_id && { cluster_id }),
          ...(program_ids?.length && {
            programs: { connect: program_ids.map((id: number) => ({ id })) },
          }),
        },
      });
      // Audit log stores only non-PII identifiers — names and email are omitted (RA 10173 §19).
      await tx.auditLog.create({
        data: { admin_id: admin.id, action: "created_user", entity_type: "User", entity_id: u.id, details: { role, school_id: school_id ?? null, cluster_id: cluster_id ?? null } },
      });
      return u;
    });
    return c.json({ id: user.id, email: user.email, role: user.role });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return c.json({ error: "Email already exists" }, 409);
    logger.error("Unexpected error creating user", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

adminRoutes.patch("/users/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const { name, first_name, middle_initial, last_name, role, school_id, cluster_id, program_ids, is_active } = body;

  const cesRoles = ["CES-SGOD", "CES-ASDS", "CES-CID"];
  if (role !== undefined && cesRoles.includes(role)) {
    const existing = await prisma.user.findFirst({ where: { role, NOT: { id } } });
    if (existing) {
      return c.json({ error: `A ${role} account already exists. Only one account per CES role is allowed.` }, 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name            !== undefined) updateData.name            = name;
  if (first_name      !== undefined) updateData.first_name      = first_name;
  if (middle_initial  !== undefined) updateData.middle_initial  = middle_initial;
  if (last_name       !== undefined) updateData.last_name       = last_name;
  if (role            !== undefined) updateData.role            = role;
  if (is_active       !== undefined) updateData.is_active       = is_active;

  // Handle school_id and cluster_id based on role
  if (role === "School" && school_id !== undefined) {
    updateData.school_id = school_id;
    updateData.cluster_id = null;
  } else if (role === "Cluster Coordinator") {
    updateData.school_id = null;
    if (cluster_id !== undefined) updateData.cluster_id = cluster_id;
  } else if (["Division Personnel", "Admin", "CES-SGOD", "CES-ASDS", "CES-CID"].includes(role)) {
    updateData.school_id = null;
    updateData.cluster_id = null;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(program_ids !== undefined && {
          programs: { set: program_ids.map((pid: number) => ({ id: pid })) },
        }),
      },
    });

    await writeAuditLog(admin.id, "updated_user", "User", id, body);
    return c.json({ id: user.id, email: user.email, role: user.role, is_active: user.is_active });
  } catch (err: unknown) {
    logger.error("Error updating user", err);
    return c.json({ error: "Failed to update user." }, 500);
  }
});

adminRoutes.delete("/users/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);

  if (id === admin.id) return c.json({ error: "Cannot delete your own account" }, 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return c.json({ error: "Not found" }, 404);

  await prisma.user.delete({ where: { id } });
  // Audit log stores only non-PII identifiers — email is omitted (RA 10173 §19).
  await writeAuditLog(admin.id, "deleted_user", "User", id, { role: user.role });
  return c.json({ success: true });
});

adminRoutes.post("/users/:id/reset-password", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);

  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 10);

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({ where: { id }, data: { password: hashed } });
  await writeAuditLog(admin.id, "reset_password", "User", id, {});

  // Return the temporary password ONLY in the API response body (over HTTPS to the admin).
  // Never log credentials to stdout — they would be captured by container logs.
  return c.json({ success: true, temporaryPassword: tempPassword, message: "Password reset successful. Share this temporary password securely with the user." });
});

// ==========================================
// SCHOOLS & CLUSTERS
// ==========================================

adminRoutes.get("/clusters", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const clusters = await prisma.cluster.findMany({
    include: {
      schools: {
        include: {
          aips: { select: { id: true, year: true, status: true } },
          users: { select: { id: true, email: true, name: true, first_name: true, last_name: true } },
          restricted_programs: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { cluster_number: "asc" },
  });
  return c.json(clusters);
});

adminRoutes.post("/clusters", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { cluster_number, name } = sanitizeObject(await c.req.json());
  if (!cluster_number) return c.json({ error: "Cluster number is required" }, 400);
  try {
    const cluster = await prisma.cluster.create({ data: { cluster_number: Number(cluster_number), name } });
    await writeAuditLog(admin.id, "created_cluster", "Cluster", cluster.id, { cluster_number, name });
    return c.json(cluster);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: `Cluster ${cluster_number} already exists` }, 409);
    throw e;
  }
});

adminRoutes.patch("/clusters/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { cluster_number, name } = sanitizeObject(await c.req.json());
  if (!cluster_number) return c.json({ error: "Cluster number is required" }, 400);
  try {
    const cluster = await prisma.cluster.update({ where: { id }, data: { cluster_number: Number(cluster_number), name } });
    await writeAuditLog(admin.id, "updated_cluster", "Cluster", id, { cluster_number, name });
    return c.json(cluster);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: `Cluster ${cluster_number} already exists` }, 409);
    throw e;
  }
});

adminRoutes.delete("/clusters/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const schoolCount = await prisma.school.count({ where: { cluster_id: id } });
  if (schoolCount > 0) {
    return c.json({ error: "Cannot delete a cluster that has schools assigned to it" }, 400);
  }
  await prisma.cluster.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_cluster", "Cluster", id, {});
  return c.json({ success: true });
});

adminRoutes.get("/schools", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const clusterId = c.req.query("cluster") ? safeParseInt(c.req.query("cluster"), 0) : undefined;
  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      cluster: true,
      users: { select: { id: true, email: true, name: true, first_name: true, last_name: true } },
      restricted_programs: { select: { id: true, title: true } },
      aips: { select: { id: true, year: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
  return c.json(schools);
});

adminRoutes.post("/schools", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { name, abbreviation, level, cluster_id } = sanitizeObject(await c.req.json());
  const school = await prisma.school.create({ data: { name, abbreviation: abbreviation || null, level, cluster_id } });
  await writeAuditLog(admin.id, "created_school", "School", school.id, { name, abbreviation, level, cluster_id });
  return c.json(school);
});

adminRoutes.patch("/schools/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const { name, abbreviation, level, cluster_id } = body;
  const school = await prisma.school.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...('abbreviation' in body && { abbreviation: abbreviation || null }),
      ...(level && { level }),
      ...(cluster_id && { cluster_id }),
    },
  });
  await writeAuditLog(admin.id, "updated_school", "School", id, body);
  return c.json(school);
});

adminRoutes.delete("/schools/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.school.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_school", "School", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/schools/:id/restrictions", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { restricted_program_ids } = await c.req.json();
  await prisma.school.update({
    where: { id },
    data: {
      restricted_programs: {
        set: restricted_program_ids.map((pid: number) => ({ id: pid })),
      },
    },
  });
  await writeAuditLog(admin.id, "updated_school_restrictions", "School", id, { restricted_program_ids });
  return c.json({ success: true });
});

// ==========================================
// PROGRAMS
// ==========================================

adminRoutes.get("/programs", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const programs = await prisma.program.findMany({
    include: {
      personnel: { select: { id: true, name: true, email: true, first_name: true, last_name: true, middle_initial: true } },
      restricted_schools: { select: { id: true, name: true } },
      _count: { select: { aips: true } },
    },
    orderBy: { title: "asc" },
  });
  return c.json(programs);
});

adminRoutes.post("/programs", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { title, abbreviation, division, school_level_requirement } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.program.create({ data: { title, abbreviation: abbreviation || null, division: division || null, school_level_requirement } });
    await writeAuditLog(admin.id, "created_program", "Program", program.id, { title });
    return c.json(program);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: "A program with that title already exists for that applicability level." }, 409);
    throw e;
  }
});

adminRoutes.patch("/programs/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { title, abbreviation, division, school_level_requirement } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.program.update({
      where: { id },
      data: { title, abbreviation: abbreviation || null, division: division || null, school_level_requirement },
    });
    await writeAuditLog(admin.id, "updated_program", "Program", id, { title, abbreviation, division, school_level_requirement });
    return c.json(program);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: "A program with that title already exists for that applicability level." }, 409);
    throw e;
  }
});

adminRoutes.delete("/programs/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.program.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_program", "Program", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/programs/:id/personnel", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { user_ids } = await c.req.json();
  await prisma.program.update({
    where: { id },
    data: { personnel: { set: user_ids.map((uid: number) => ({ id: uid })) } },
  });
  await writeAuditLog(admin.id, "updated_program_personnel", "Program", id, { user_ids });
  return c.json({ success: true });
});

// ==========================================
// DIVISION PROGRAMS
// ==========================================

adminRoutes.get("/division-programs", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const programs = await prisma.divisionProgram.findMany({
    orderBy: [{ division: "asc" }, { title: "asc" }],
  });
  return c.json(programs);
});

adminRoutes.post("/division-programs", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { title, abbreviation, division } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.divisionProgram.create({
      data: { title, abbreviation: abbreviation || null, division },
    });
    await writeAuditLog(admin.id, "created_division_program", "DivisionProgram", program.id, { title, division });
    return c.json(program);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: "A program with that title already exists in that division." }, 409);
    throw e;
  }
});

adminRoutes.patch("/division-programs/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  const { title, abbreviation, division } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.divisionProgram.update({
      where: { id },
      data: { title, abbreviation: abbreviation || null, division },
    });
    await writeAuditLog(admin.id, "updated_division_program", "DivisionProgram", id, { title, division });
    return c.json(program);
  } catch (e: any) {
    if (e?.code === "P2002") return c.json({ error: "A program with that title already exists in that division." }, 409);
    throw e;
  }
});

adminRoutes.delete("/division-programs/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.divisionProgram.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_division_program", "DivisionProgram", id, {});
  return c.json({ success: true });
});

// ==========================================
// DEADLINES
// ==========================================

adminRoutes.get("/deadlines", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear(), 2020, 2100);
  const deadlines = await prisma.deadline.findMany({ where: { year } });
  const defaults: Record<number, string> = {
    1: `${year}-03-31`, 2: `${year}-06-30`, 3: `${year}-09-30`, 4: `${year}-12-31`,
  };
  const result = [1, 2, 3, 4].map((q) => {
    const custom = deadlines.find((d) => d.quarter === q);
    return {
      quarter: q,
      year,
      date: custom ? custom.date : new Date(defaults[q]),
      open_date: custom?.open_date ?? null,
      grace_period_days: custom?.grace_period_days ?? 0,
      isCustom: !!custom,
      id: custom?.id ?? null,
    };
  });
  return c.json(result);
});

adminRoutes.post("/deadlines", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { year, quarter, date, open_date, grace_period_days } = await c.req.json();

  // Validate year
  const parsedYear = safeParseInt(year, 0, 2020, 2100);
  if (parsedYear < 2020 || parsedYear > 2100) {
    return c.json({ error: "Invalid year (must be 2020–2100)" }, 400);
  }

  // Validate quarter
  if (![1, 2, 3, 4].includes(quarter)) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }

  // Validate deadline date
  const deadlineDate = new Date(date);
  if (isNaN(deadlineDate.getTime())) {
    return c.json({ error: "Invalid date" }, 400);
  }

  // Validate open_date if provided
  let openDate: Date | null = null;
  if (open_date) {
    openDate = new Date(open_date);
    if (isNaN(openDate.getTime())) {
      return c.json({ error: "Invalid open_date" }, 400);
    }
    if (openDate >= deadlineDate) {
      return c.json({ error: "Open date must be before deadline" }, 400);
    }
  }

  // Validate grace_period_days
  const graceDays = safeParseInt(grace_period_days, 0, 0, 30);
  if (graceDays < 0 || graceDays > 30) {
    return c.json({ error: "Grace period must be between 0 and 30 days" }, 400);
  }

  const existing = await prisma.deadline.findUnique({ where: { year_quarter: { year: parsedYear, quarter } } });
  const deadline = await prisma.deadline.upsert({
    where: { year_quarter: { year: parsedYear, quarter } },
    update: {
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
    },
    create: {
      year: parsedYear,
      quarter,
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
    },
  });
  await writeAuditLog(admin.id, "changed_deadline", "Deadline", deadline.id, {
    year: parsedYear, quarter, newDate: date, previousDate: existing?.date ?? null,
  });
  return c.json(deadline);
});

adminRoutes.delete("/deadlines/:id", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.deadline.delete({ where: { id } });
  await writeAuditLog(admin.id, "reset_deadline", "Deadline", id, {});
  return c.json({ success: true });
});

adminRoutes.get("/deadlines/history", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const logs = await prisma.auditLog.findMany({
    where: { entity_type: "Deadline" },
    include: { admin: { select: { name: true, email: true } } },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return c.json(logs);
});

// ==========================================
// REPORTS
// ==========================================

const reportRequests = new Map<number, number[]>();
const MAX_REPORT_REQUESTS = 60;
const REPORT_WINDOW_MS = 60 * 1000;

adminRoutes.use("/reports/*", async (c, next) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const now = Date.now();
  let timestamps = reportRequests.get(admin.id) || [];
  timestamps = timestamps.filter(t => now - t < REPORT_WINDOW_MS);
  if (timestamps.length >= MAX_REPORT_REQUESTS) {
    return c.json({ error: "Rate limit exceeded for reports. Please wait." }, 429);
  }
  timestamps.push(now);
  reportRequests.set(admin.id, timestamps);
  await next();
});

adminRoutes.get("/reports/years", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const rows = await prisma.aIP.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  const years = rows.map((r) => r.year);
  return c.json({ years });
});

adminRoutes.get("/reports/compliance", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);
  const clusterRaw = c.req.query("cluster");
  const clusterId = clusterRaw ? safeParseInt(clusterRaw, 0) : undefined;
  if (clusterId !== undefined && (isNaN(clusterId) || clusterId < 1)) return c.json({ error: "Invalid cluster" }, 400);

  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      aips: { where: { year }, include: { program: true } },
      restricted_programs: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  const programs = await prisma.program.findMany({
    where: { school_level_requirement: { not: "Division" } },
    orderBy: { title: "asc" },
  });

  const matrix = schools.map((s) => {
    const row: Record<string, unknown> = { schoolId: s.id, school: s.name, level: s.level };
    for (const prog of programs) {
      const submitted = s.aips.some((a) => a.program_id === prog.id);
      const eligible =
        prog.school_level_requirement === "Both" ||
        prog.school_level_requirement === s.level ||
        (prog.school_level_requirement === "Select Schools" &&
          !s.restricted_programs?.some((r) => r.id === prog.id));
      row[prog.title] = eligible ? (submitted ? "submitted" : "missing") : "na";
    }
    return row;
  });

  return c.json({ matrix, programs: programs.map((p) => p.title), year });
});

adminRoutes.get("/reports/quarterly", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);
  const clusterRaw = c.req.query("cluster");
  const clusterId = clusterRaw ? safeParseInt(clusterRaw, 0) : undefined;
  if (clusterId !== undefined && (isNaN(clusterId) || clusterId < 1)) return c.json({ error: "Invalid cluster" }, 400);

  const pirs = await prisma.pIR.findMany({
    where: { aip: { year, ...(clusterId && { school: { cluster_id: clusterId } }) } },
    include: { aip: { include: { school: true, program: true } } },
  });

  const quarterLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
  const summary = quarterLabels.map((ql, i) => {
    const quarterPIRs = pirs.filter((p) => p.quarter.startsWith(`${i + 1}`));
    return {
      quarter: `Q${i + 1}`,
      submitted: quarterPIRs.filter((p) => ["Submitted", "Approved"].includes(p.status)).length,
      pending: quarterPIRs.filter((p) => p.status === "Submitted").length,
      approved: quarterPIRs.filter((p) => p.status === "Approved").length,
      returned: quarterPIRs.filter((p) => p.status === "Returned").length,
    };
  });

  return c.json({ summary, year });
});

adminRoutes.get("/reports/budget", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);

  const activities = await prisma.aIPActivity.findMany({
    where: { aip: { year } },
    include: { aip: { include: { program: true, school: true } } },
  });

  const byProgram: Record<string, { program: string; total: number; sources: Record<string, number>; activityCount: number }> = {};
  for (const act of activities) {
    const key = act.aip.program.title;
    if (!byProgram[key]) byProgram[key] = { program: key, total: 0, sources: {}, activityCount: 0 };
    const amt = Number(act.budget_amount);
    byProgram[key].total += amt;
    byProgram[key].activityCount += 1;
    byProgram[key].sources[act.budget_source] = (byProgram[key].sources[act.budget_source] ?? 0) + amt;
  }

  return c.json({ data: Object.values(byProgram), year });
});

adminRoutes.get("/reports/workload", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);
  const personnel = await prisma.user.findMany({
    where: { role: "Division Personnel", is_active: true },
    include: {
      programs: true,
      aips: { where: { year } },
      pirs: { where: { aip: { year } } },
    },
  });

  return c.json(
    personnel.map((p) => ({
      id: p.id,
      name: p.name ?? p.email,
      email: p.email,
      programCount: p.programs.length,
      aipCount: p.aips.length,
      pirCount: p.pirs.length,
    }))
  );
});

adminRoutes.get("/reports/accomplishment", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);

  const reviews = await prisma.pIRActivityReview.findMany({
    where: { pir: { aip: { year } } },
    include: {
      pir: {
        include: {
          aip: { include: { school: { include: { cluster: true } } } },
        },
      },
    },
  });

  const bySchool: Record<string, { school: string; cluster: string; physSum: number; physCount: number; finSum: number; finCount: number }> = {};

  for (const r of reviews) {
    const school = r.pir.aip.school?.name ?? "Division";
    const cluster = r.pir.aip.school?.cluster?.name ?? "Division";
    if (!bySchool[school]) bySchool[school] = { school, cluster, physSum: 0, physCount: 0, finSum: 0, finCount: 0 };
    const physTarget = Number(r.physical_target);
    const finTarget = Number(r.financial_target);
    if (physTarget > 0) {
      bySchool[school].physSum += (Number(r.physical_accomplished) / physTarget) * 100;
      bySchool[school].physCount += 1;
    }
    if (finTarget > 0) {
      bySchool[school].finSum += (Number(r.financial_accomplished) / finTarget) * 100;
      bySchool[school].finCount += 1;
    }
  }

  const data = Object.values(bySchool).map((s) => ({
    school: s.school,
    cluster: s.cluster,
    physicalRate: s.physCount > 0 ? Math.round(s.physSum / s.physCount) : 0,
    financialRate: s.finCount > 0 ? Math.round(s.finSum / s.finCount) : 0,
  }));

  return c.json({ data, year });
});

adminRoutes.get("/reports/factors", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);

  const factors = await prisma.pIRFactor.findMany({
    where: { pir: { aip: { year } } },
  });

  const TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];
  const data = TYPES.map((t) => {
    const matching = factors.filter((f) => f.factor_type.trim() === t);
    return {
      type: t,
      facilitating: matching.filter((f) => f.facilitating_factors?.trim()).length,
      hindering: matching.filter((f) => f.hindering_factors?.trim()).length,
    };
  });

  return c.json({ data, year });
});

adminRoutes.get("/reports/aip-funnel", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);

  const aips = await prisma.aIP.findMany({
    where: { year },
    select: { status: true },
  });

  const STATUSES = ["Draft", "Submitted", "Under Review", "Approved", "Returned"];
  const data = STATUSES.map((s) => ({
    status: s,
    count: aips.filter((a) => a.status === s).length,
  })).filter((d) => d.count > 0);

  return c.json({ data, year });
});

adminRoutes.get("/reports/cluster-pir-summary", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);
  const quarter = safeParseInt(c.req.query("quarter"), 1);
  if (![1, 2, 3, 4].includes(quarter)) return c.json({ error: "Invalid quarter (must be 1\u20134)" }, 400);
  const clusterRaw = c.req.query("cluster");
  const clusterId = clusterRaw ? safeParseInt(clusterRaw, 0) : undefined;
  if (!clusterId || isNaN(clusterId) || clusterId < 1) return c.json({ error: "cluster parameter is required" }, 400);

  const quarterPrefixes: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
  const qPrefix = quarterPrefixes[quarter];
  if (!qPrefix) return c.json({ error: "Invalid quarter (must be 1\u20134)" }, 400);

  const programs = await prisma.program.findMany({
    where: { school_level_requirement: { not: "Division" } },
    orderBy: [{ title: "asc" }],
  });

  const schools = await prisma.school.findMany({
    where: { cluster_id: clusterId },
    include: { restricted_programs: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  const aips = await prisma.aIP.findMany({
    where: {
      year,
      school_id: { in: schools.map((s) => s.id) },
    },
    include: {
      pirs: { where: { quarter: { startsWith: qPrefix } } },
    },
  });

  // Build lookup: aipMap[schoolId][programId] = { pirId, presented }
  const aipMap: Record<number, Record<number, { pirId: number; presented: boolean }>> = {};
  for (const aip of aips) {
    if (!aip.school_id) continue;
    if (!aipMap[aip.school_id]) aipMap[aip.school_id] = {};
    const pir = aip.pirs[0];
    if (pir) {
      aipMap[aip.school_id][aip.program_id] = { pirId: pir.id, presented: pir.presented };
    }
  }

  // Build matrix and totals
  const matrix: Record<string, { eligible: boolean; pirExists: boolean; pirId: number | null; presented: boolean }> = {};
  const totals: Record<number, { pirTool: number; presented: number }> = {};

  for (const school of schools) {
    totals[school.id] = { pirTool: 0, presented: 0 };
    for (const prog of programs) {
      const eligible =
        prog.school_level_requirement === "Both" ||
        prog.school_level_requirement === school.level ||
        (prog.school_level_requirement === "Select Schools" &&
          !school.restricted_programs?.some((r) => r.id === prog.id));

      const pirData = aipMap[school.id]?.[prog.id];
      const pirExists = !!pirData;
      const presented = pirData?.presented ?? false;

      matrix[`${school.id}_${prog.id}`] = {
        eligible,
        pirExists,
        pirId: pirData?.pirId ?? null,
        presented,
      };

      if (eligible && pirExists) totals[school.id].pirTool++;
      if (eligible && presented) totals[school.id].presented++;
    }
  }

  return c.json({
    programs: programs.map((p) => ({ id: p.id, title: p.title, abbreviation: p.abbreviation, division: (p as any).division ?? null })),
    schools: schools.map((s) => ({ id: s.id, name: s.name, abbreviation: s.abbreviation })),
    matrix,
    totals,
    year,
    quarter,
  });
});

adminRoutes.get("/reports/:type/export", async (c) => {
  const reportExporter = requireAdmin(c);
  if (!reportExporter) return c.json({ error: "Unauthorized" }, 401);
  const type = c.req.param("type");
  const format = c.req.query("format") || "csv";
  const year = safeParseInt(c.req.query("year"), new Date().getFullYear());
  if (isNaN(year) || year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020\u20132100)" }, 400);

  let rows: Record<string, unknown>[] = [];

  if (type === "workload") {
    const personnel = await prisma.user.findMany({
      where: { role: "Division Personnel", is_active: true },
      include: { programs: true, aips: true, pirs: true },
    });
    rows = personnel.map((p) => ({
      Name: p.name ?? p.email,
      Email: p.email,
      Programs: p.programs.length,
      AIPs: p.aips.length,
      PIRs: p.pirs.length,
    }));
  } else if (type === "budget") {
    const activities = await prisma.aIPActivity.findMany({
      where: { aip: { year } },
      include: { aip: { include: { program: true, school: true } } },
    });
    rows = activities.map((a) => ({
      Program: a.aip.program.title,
      School: a.aip.school?.name ?? "Division",
      Activity: a.activity_name,
      Phase: a.phase,
      "Budget Amount": Number(a.budget_amount),
      "Budget Source": a.budget_source,
    }));
  } else if (type === "compliance") {
    const aips = await prisma.aIP.findMany({
      where: { year },
      include: { school: { include: { cluster: true } }, program: true },
    });
    rows = aips.map((a) => ({
      School: a.school?.name ?? "Division",
      Cluster: a.school?.cluster ? `Cluster ${a.school.cluster.cluster_number}` : "—",
      Program: a.program.title,
      Year: a.year,
      Status: a.status,
    }));
  } else if (type === "quarterly") {
    const pirs = await prisma.pIR.findMany({
      where: { aip: { year } },
      include: { aip: { include: { school: { include: { cluster: true } }, program: true } } },
    });
    rows = pirs.map((p) => ({
      School: p.aip.school?.name ?? "Division",
      Cluster: p.aip.school?.cluster ? `Cluster ${p.aip.school.cluster.cluster_number}` : "—",
      Program: p.aip.program.title,
      Quarter: p.quarter,
      Year: p.aip.year,
      Status: p.status,
    }));
  } else if (type === "accomplishment") {
    const reviews = await prisma.pIRActivityReview.findMany({
      where: { pir: { aip: { year } } },
      include: { pir: { include: { aip: { include: { school: { include: { cluster: true } } } } } } },
    });
    const bySchool: Record<string, { school: string; cluster: string; physSum: number; physCount: number; finSum: number; finCount: number }> = {};
    for (const r of reviews) {
      const school = r.pir.aip.school?.name ?? "Division";
      const cluster = r.pir.aip.school?.cluster?.name ?? "Division";
      if (!bySchool[school]) bySchool[school] = { school, cluster, physSum: 0, physCount: 0, finSum: 0, finCount: 0 };
      const physTarget = Number(r.physical_target);
      const finTarget = Number(r.financial_target);
      if (physTarget > 0) { bySchool[school].physSum += (Number(r.physical_accomplished) / physTarget) * 100; bySchool[school].physCount += 1; }
      if (finTarget > 0) { bySchool[school].finSum += (Number(r.financial_accomplished) / finTarget) * 100; bySchool[school].finCount += 1; }
    }
    rows = Object.values(bySchool).map((s) => ({
      School: s.school,
      Cluster: s.cluster,
      "Physical Rate (%)": s.physCount > 0 ? Math.round(s.physSum / s.physCount) : 0,
      "Financial Rate (%)": s.finCount > 0 ? Math.round(s.finSum / s.finCount) : 0,
    }));
  } else if (type === "factors") {
    const factors = await prisma.pIRFactor.findMany({ where: { pir: { aip: { year } } } });
    const TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];
    rows = TYPES.map((t) => {
      const matching = factors.filter((f) => f.factor_type.trim() === t);
      const facilitating = matching.filter((f) => f.facilitating_factors?.trim()).length;
      const hindering = matching.filter((f) => f.hindering_factors?.trim()).length;
      return { "Factor Type": t, Facilitating: facilitating, Hindering: hindering, Total: facilitating + hindering };
    });
  } else if (type === "sources") {
    const activities = await prisma.aIPActivity.findMany({
      where: { aip: { year } },
      select: { budget_source: true, budget_amount: true },
    });
    const sourceMap: Record<string, number> = {};
    for (const a of activities) {
      const key = a.budget_source?.trim() || "Unspecified";
      sourceMap[key] = (sourceMap[key] ?? 0) + Number(a.budget_amount);
    }
    rows = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, total]) => ({ Source: source, "Total Amount": total }));
  } else if (type === "funnel") {
    const aips = await prisma.aIP.findMany({ where: { year }, select: { status: true } });
    const STATUSES = ["Draft", "Submitted", "Under Review", "Approved", "Returned"];
    const total = aips.length;
    rows = STATUSES.map((s) => {
      const count = aips.filter((a) => a.status === s).length;
      return { Status: s, Count: count, "% of Total": total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0.0%" };
    }).filter((r) => Number(r.Count) > 0);
  }

  await writeAuditLog(reportExporter.id, "exported_report", "Export", 0, {
    report_type: type, year, format, row_count: rows.length,
  });

  if (!rows.length) {
    return c.json({ error: `No data found for report type '${type}' in year ${year}.` }, 404);
  }

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-report-${year}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    return new Response(toXLSX(rows, type), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-report-${year}.xlsx"`,
      },
    });
  }

  return c.json({ data: rows, type, year });
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

adminRoutes.get("/announcements", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const announcement = await prisma.announcement.findFirst({
    orderBy: { updated_at: "desc" },
    include: {
      mentioned_schools: { include: { school: { select: { id: true, name: true } } } },
      mentioned_users:   { include: { user:   { select: { id: true, first_name: true, last_name: true, name: true } } } },
    },
  });
  return c.json(announcement ?? null);
});

adminRoutes.post("/announcements", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { message, type, is_active, dismissible, expires_at } = sanitizeObject(await c.req.json());

  const expiresAtDate = expires_at ? new Date(expires_at) : null;

  // ── Resolve @[Name] mentions → school/user IDs (reads before transaction) ──
  const mentionTokens: string[] = [...message.matchAll(/@\[([^\]]+)\]/g)].map((m: RegExpMatchArray) => m[1] as string);

  const mentionedSchoolIds: number[] = [];
  const mentionedUserIds:   number[] = [];

  if (mentionTokens.length > 0) {
    const [allSchools, allDivPersonnel] = await Promise.all([
      prisma.school.findMany({ select: { id: true, name: true, abbreviation: true } }),
      prisma.user.findMany({
        where: { role: "Division Personnel", is_active: true },
        select: { id: true, name: true, first_name: true, last_name: true },
      }),
    ]);

    for (const token of mentionTokens) {
      const lc = token.toLowerCase();
      const school = allSchools.find(s =>
        s.name.toLowerCase() === lc || (s.abbreviation ?? "").toLowerCase() === lc
      );
      if (school) { mentionedSchoolIds.push(school.id); continue; }

      const user = allDivPersonnel.find(u => {
        const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
        return full.toLowerCase() === lc || (u.name ?? "").toLowerCase() === lc;
      });
      if (user) mentionedUserIds.push(user.id);
    }
  }

  const announcement = await prisma.$transaction(async (tx) => {
    // Upsert: only ever keep one announcement (update most recent or create new)
    const existing = await tx.announcement.findFirst({ orderBy: { created_at: "desc" } });
    const ann = existing
      ? await tx.announcement.update({
          where: { id: existing.id },
          data: { message, type: type ?? "info", is_active: is_active ?? true, dismissible: dismissible ?? true, expires_at: expiresAtDate },
        })
      : await tx.announcement.create({
          data: { message, type: type ?? "info", is_active: is_active ?? true, dismissible: dismissible ?? true, expires_at: expiresAtDate, created_by: admin.id },
        });

    // Replace old mention records
    await tx.announcementMentionSchool.deleteMany({ where: { announcement_id: ann.id } });
    await tx.announcementMentionUser.deleteMany({ where: { announcement_id: ann.id } });

    if (mentionedSchoolIds.length > 0) {
      await tx.announcementMentionSchool.createMany({
        data: mentionedSchoolIds.map(sid => ({ announcement_id: ann.id, school_id: sid })),
      });
    }
    if (mentionedUserIds.length > 0) {
      await tx.announcementMentionUser.createMany({
        data: mentionedUserIds.map(uid => ({ announcement_id: ann.id, user_id: uid })),
      });
    }

    // ── Notify mentioned users ────────────────────────────────────────
    if (mentionedSchoolIds.length > 0 || mentionedUserIds.length > 0) {
      const schoolUsers = mentionedSchoolIds.length > 0
        ? await tx.user.findMany({
            where: { school_id: { in: mentionedSchoolIds }, is_active: true },
            select: { id: true },
          })
        : [];

      const notifyIds = [...new Set([
        ...schoolUsers.map(u => u.id),
        ...mentionedUserIds,
      ])];

      const plainMessage = message.replace(/@\[([^\]]+)\]/g, (_: string, n: string) => `@${n}`);

      if (notifyIds.length > 0) {
        const annNotifs = await tx.notification.createManyAndReturn({
          data: notifyIds.map(uid => ({
            user_id: uid,
            title:   "You were mentioned in an announcement",
            message: plainMessage,
            type:    "announcement",
            entity_id: ann.id,
            entity_type: 'announcement',
          })),
          skipDuplicates: true,
        });
        // Store for post-commit push (pushing inside tx risks sending before commit)
        Object.assign(ann, { _sseNotifs: annNotifs });
      }
    }

    await tx.auditLog.create({
      data: { admin_id: admin.id, action: "updated_announcement", entity_type: "Announcement", entity_id: ann.id, details: { message, type, is_active, dismissible } },
    });

    return ann;
  });

  // Push announcement notifications after transaction commits
  const sseNotifs = (announcement as any)._sseNotifs;
  if (sseNotifs?.length) pushNotifications(sseNotifs);

  return c.json(announcement);
});

adminRoutes.delete("/announcements", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const existing = await prisma.announcement.findFirst({ orderBy: { created_at: "desc" } });
  if (!existing) return c.json({ ok: true });
  await prisma.$transaction([
    prisma.announcementMentionSchool.deleteMany({ where: { announcement_id: existing.id } }),
    prisma.announcementMentionUser.deleteMany({ where: { announcement_id: existing.id } }),
    prisma.announcement.delete({ where: { id: existing.id } }),
  ]);
  await prisma.auditLog.create({
    data: { admin_id: admin.id, action: "deleted_announcement", entity_type: "Announcement", entity_id: existing.id, details: {} },
  });
  return c.json({ ok: true });
});

// ==========================================
// AUDIT LOG
// ==========================================

// NOTE: No frontend consumer yet — retained for future Admin Audit Log page
adminRoutes.get("/audit-log", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = Math.min(100, safeParseInt(c.req.query("limit"), 50));
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return c.json({ data: logs, total, page, totalPages: Math.ceil(total / limit) });
});

// ==========================================
// SYSTEM SETTINGS
// ==========================================

// Lightweight endpoint for AdminLayout — avoids the full /overview query
adminRoutes.get("/layout-info", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3);

  const deadline = await prisma.deadline.findUnique({
    where: { year_quarter: { year, quarter: currentQuarter } },
  });
  const defaultDeadlines: Record<number, Date> = {
    1: new Date(year, 2,  31, 23, 59, 59, 999),
    2: new Date(year, 5,  30, 23, 59, 59, 999),
    3: new Date(year, 8,  30, 23, 59, 59, 999),
    4: new Date(year, 11, 31, 23, 59, 59, 999),
  };
  const deadlineDate = deadline
    ? new Date(new Date(deadline.date).setHours(23, 59, 59, 999))
    : defaultDeadlines[currentQuarter];
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return c.json({ daysLeft, currentQuarter, deadlineDate });
});

adminRoutes.get("/settings/system-info", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const [userCount, schoolCount, programCount] = await Promise.all([
    prisma.user.count(),
    prisma.school.count(),
    prisma.program.count(),
  ]);
  return c.json({ userCount, schoolCount, programCount });
});

// ==========================================
// DIVISION CONFIG
// ==========================================

adminRoutes.get("/settings/division-config", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const config = await prisma.divisionConfig.findFirst();
  return c.json(config ?? { supervisor_name: "", supervisor_title: "" });
});

adminRoutes.post("/settings/division-config", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { supervisor_name, supervisor_title } = sanitizeObject(await c.req.json());
  const existing = await prisma.divisionConfig.findFirst();
  let config;
  if (existing) {
    config = await prisma.divisionConfig.update({
      where: { id: existing.id },
      data: { supervisor_name: supervisor_name ?? "", supervisor_title: supervisor_title ?? "" },
    });
  } else {
    config = await prisma.divisionConfig.create({
      data: { supervisor_name: supervisor_name ?? "", supervisor_title: supervisor_title ?? "" },
    });
  }
  await writeAuditLog(admin.id, "updated_division_config", "DivisionConfig", config.id, { supervisor_name, supervisor_title });
  return c.json(config);
});

// ==========================================
// AUDIT LOG VIEWER (RA 10173 §20 — data controller access)
// ==========================================

adminRoutes.get("/audit-logs", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  const page = Math.max(1, safeParseInt(c.req.query("page"), 1));
  const limit = Math.min(100, safeParseInt(c.req.query("limit"), 50));
  const action = c.req.query("action");
  const entity_type = c.req.query("entity_type");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;

  const where = {
    ...(action && { action: { contains: action } }),
    ...(entity_type && { entity_type }),
    ...(from || to ? { created_at: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin_id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        details: true,
        created_at: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return c.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
});

// ==========================================
// USER ANONYMIZATION (RA 10173 §23 — Right to Erasure)
// Nulls out PII fields while preserving the user record for audit trail integrity.
// ==========================================

adminRoutes.post("/users/:id/anonymize", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const id = safeParseInt(c.req.param("id"), 0);

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return c.json({ error: "Not found" }, 404);

  await prisma.user.update({
    where: { id },
    data: {
      name: null,
      first_name: null,
      middle_initial: null,
      last_name: null,
      email: `anonymized_${id}@deleted.local`,
      password: "ANONYMIZED",
      is_active: false,
      deleted_at: new Date(),
    },
  });

  await writeAuditLog(admin.id, "anonymized_user", "User", id, { role: user.role });
  return c.json({ success: true, message: "User PII has been anonymized (RA 10173 §23)." });
});

export default adminRoutes;
