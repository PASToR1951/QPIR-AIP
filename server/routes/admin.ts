import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

const adminRoutes = new Hono();
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";

// ==========================================
// AUTH HELPER
// ==========================================

interface TokenPayload {
  id: number;
  role: string;
  school_id: number | null;
  email: string;
  name: string | null;
}

function getUserFromToken(authHeader: string | undefined): TokenPayload | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

function requireAdmin(authHeader: string | undefined): TokenPayload {
  const user = getUserFromToken(authHeader);
  if (!user || user.role !== "Admin") throw new Error("FORBIDDEN");
  return user;
}

async function writeAuditLog(
  adminId: number,
  action: string,
  entityType: string,
  entityId: number,
  details: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: { admin_id: adminId, action, entity_type: entityType, entity_id: entityId, details },
  });
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  return "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
}

// Wrap every admin handler with auth check
adminRoutes.use("*", async (c, next) => {
  try {
    requireAdmin(c.req.header("Authorization"));
  } catch {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});

// ==========================================
// OVERVIEW
// ==========================================

adminRoutes.get("/overview", async (c) => {
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));

  // Current quarter (needed early for PIR queries)
  const month = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3);

  const quarterPrefixes: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

  const [totalSchools, totalUsers, totalPrograms, aipCount, pirCount, pirsByQuarter, schoolsWithAIP] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.program.count(),
    prisma.aIP.count({ where: { year } }),
    prisma.pIR.count(),
    // PIR quarterly breakdown for the current year
    prisma.pIR.findMany({
      where: { aip: { year } },
      select: { quarter: true, status: true },
    }),
    // AIP compliance: schools with at least one AIP this year
    prisma.aIP.findMany({
      where: { year, school_id: { not: null } },
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
      submitted: qPirs.filter((p) => p.status === "Submitted").length,
      approved: qPirs.filter((p) => p.status === "Approved").length,
      underReview: qPirs.filter((p) => p.status === "Under Review").length,
      returned: qPirs.filter((p) => p.status === "Returned").length,
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
  const defaultDeadlines: Record<number, string> = {
    1: `${year}-03-31`,
    2: `${year}-06-30`,
    3: `${year}-09-30`,
    4: `${year}-12-31`,
  };
  const deadlineDate = deadline
    ? deadline.date
    : new Date(defaultDeadlines[currentQuarter]);
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Recent submissions (PIR-heavy: 7 PIRs, 3 AIPs)
  const recentAIPs = await prisma.aIP.findMany({
    take: 3,
    orderBy: { created_at: "desc" },
    include: { school: true, program: true, created_by: true },
  });
  const recentPIRs = await prisma.pIR.findMany({
    take: 7,
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
      submittedBy: a.created_by?.name ?? a.created_by?.email ?? "—",
    })),
    ...recentPIRs.map((p) => ({
      id: p.id,
      type: "PIR",
      school: p.aip.school?.name ?? "Division",
      program: p.aip.program.title,
      quarter: p.quarter,
      submitted: p.created_at,
      status: p.status,
      submittedBy: p.created_by?.name ?? p.created_by?.email ?? "—",
    })),
  ]
    .sort((a, b) => {
      // PIRs first, then by date descending
      if (a.type !== b.type) return a.type === "PIR" ? -1 : 1;
      return new Date(b.submitted).getTime() - new Date(a.submitted).getTime();
    })
    .slice(0, 10);

  // Cluster data for both AIP compliance and PIR status heatmaps
  const currentQPrefix = quarterPrefixes[currentQuarter];
  const clusters = await prisma.cluster.findMany({
    include: {
      schools: {
        include: {
          aips: {
            where: { year },
            select: {
              id: true,
              pirs: { select: { id: true, status: true, quarter: true } },
            },
          },
        },
      },
    },
  });

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

  // PIR submission status by cluster for the current quarter
  const pirClusterStatus = clusters.map((cl) => {
    const totalSchoolsInCluster = cl.schools.length;
    const schoolsWithPIR = cl.schools.filter((s) =>
      s.aips.some((a) => a.pirs.some((p) => p.quarter.startsWith(currentQPrefix)))
    ).length;
    const approvedCount = cl.schools.filter((s) =>
      s.aips.some((a) => a.pirs.some((p) => p.quarter.startsWith(currentQPrefix) && p.status === "Approved"))
    ).length;
    return {
      id: cl.id,
      name: cl.name,
      cluster_number: cl.cluster_number,
      totalSchools: totalSchoolsInCluster,
      submitted: schoolsWithPIR,
      approved: approvedCount,
      pct: totalSchoolsInCluster > 0 ? Math.round((schoolsWithPIR / totalSchoolsInCluster) * 100) : 0,
    };
  });

  return c.json({
    stats: {
      totalSchools,
      totalUsers,
      totalPrograms,
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
  const clusterId = q("cluster") ? parseInt(q("cluster")!) : undefined;
  const schoolId = q("school") ? parseInt(q("school")!) : undefined;
  const programId = q("program") ? parseInt(q("program")!) : undefined;
  const quarter = q("quarter");
  const year = q("year") ? parseInt(q("year")!) : undefined;
  const status = q("status");
  const page = parseInt(q("page") || "1");
  const limit = parseInt(q("limit") || "25");
  const skip = (page - 1) * limit;

  const schoolFilter = schoolId
    ? { id: schoolId }
    : clusterId
    ? { cluster_id: clusterId }
    : undefined;

  // Build AIP results
  let aips: unknown[] = [];
  let aipTotal = 0;
  if (!type || type === "aip" || type === "all") {
    const where = {
      ...(year && { year }),
      ...(programId && { program_id: programId }),
      ...(status && { status }),
      ...(schoolFilter && { school: schoolFilter }),
    };
    [aips, aipTotal] = await Promise.all([
      prisma.aIP.findMany({
        where,
        skip: type === "aip" ? skip : 0,
        take: type === "aip" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: { school: { include: { cluster: true } }, program: true, created_by: true },
      }),
      prisma.aIP.count({ where }),
    ]);
  }

  // Build PIR results
  let pirs: unknown[] = [];
  let pirTotal = 0;
  if (!type || type === "pir" || type === "all") {
    const where = {
      ...(quarter && { quarter: { contains: `${quarter}` } }),
      ...(status && { status }),
      aip: {
        ...(year && { year }),
        ...(programId && { program_id: programId }),
        ...(schoolFilter && { school: schoolFilter }),
      },
    };
    [pirs, pirTotal] = await Promise.all([
      prisma.pIR.findMany({
        where,
        skip: type === "pir" ? skip : 0,
        take: type === "pir" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: {
          aip: { include: { school: { include: { cluster: true } }, program: true } },
          created_by: true,
        },
      }),
      prisma.pIR.count({ where }),
    ]);
  }

  const normalizedAIPs = (aips as Record<string, unknown>[]).map((a: Record<string, unknown>) => {
    const aip = a as {
      id: number; status: string; year: number; created_at: Date;
      school?: { id: number; name: string; cluster?: { id: number; cluster_number: number; name: string } } | null;
      program: { id: number; title: string };
      created_by?: { name?: string | null; email?: string } | null;
    };
    return {
      id: aip.id, type: "AIP", status: aip.status, year: aip.year,
      quarter: null, schoolId: aip.school?.id ?? null,
      school: aip.school?.name ?? "Division",
      cluster: aip.school?.cluster ? `Cluster ${aip.school.cluster.cluster_number}` : "—",
      clusterId: aip.school?.cluster?.id ?? null,
      program: aip.program.title, programId: aip.program.id,
      dateSubmitted: aip.created_at,
      submittedBy: (aip.created_by as { name?: string | null; email?: string } | null)?.name
        ?? (aip.created_by as { name?: string | null; email?: string } | null)?.email ?? "—",
    };
  });

  const normalizedPIRs = (pirs as Record<string, unknown>[]).map((p: Record<string, unknown>) => {
    const pir = p as {
      id: number; status: string; quarter: string; created_at: Date;
      aip: {
        year: number;
        school?: { id: number; name: string; cluster?: { id: number; cluster_number: number; name: string } } | null;
        program: { id: number; title: string };
      };
      created_by?: { name?: string | null; email?: string } | null;
    };
    return {
      id: pir.id, type: "PIR", status: pir.status, year: pir.aip.year,
      quarter: pir.quarter, schoolId: pir.aip.school?.id ?? null,
      school: pir.aip.school?.name ?? "Division",
      cluster: pir.aip.school?.cluster ? `Cluster ${pir.aip.school.cluster.cluster_number}` : "—",
      clusterId: pir.aip.school?.cluster?.id ?? null,
      program: pir.aip.program.title, programId: pir.aip.program.id,
      dateSubmitted: pir.created_at,
      submittedBy: (pir.created_by as { name?: string | null; email?: string } | null)?.name
        ?? (pir.created_by as { name?: string | null; email?: string } | null)?.email ?? "—",
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
    console.error("GET /submissions error:", e);
    return c.json({ error: e instanceof Error ? e.message : "Internal server error" }, 500);
  }
});

adminRoutes.get("/submissions/export", async (c) => {
  const format = c.req.query("format") || "csv";
  const type = c.req.query("type");
  const year = c.req.query("year") ? parseInt(c.req.query("year")!) : undefined;
  const status = c.req.query("status");

  const aips = (!type || type === "aip" || type === "all")
    ? await prisma.aIP.findMany({
        where: { ...(year && { year }), ...(status && { status }) },
        include: { school: { include: { cluster: true } }, program: true, created_by: true },
        orderBy: { created_at: "desc" },
      })
    : [];

  const pirs = (!type || type === "pir" || type === "all")
    ? await prisma.pIR.findMany({
        where: { ...(status && { status }), aip: { ...(year && { year }) } },
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
      "Submitted By": a.created_by?.name ?? a.created_by?.email ?? "—",
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
      "Submitted By": p.created_by?.name ?? p.created_by?.email ?? "—",
    })),
  ];

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-export.csv"`,
      },
    });
  }

  return c.json({ data: rows });
});

adminRoutes.get("/submissions/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const type = c.req.query("type") || "aip";

  if (type === "pir") {
    const pir = await prisma.pIR.findUnique({
      where: { id },
      include: {
        aip: { include: { school: true, program: true, activities: true } },
        activity_reviews: { include: { aip_activity: true } },
        factors: true,
        created_by: true,
      },
    });
    if (!pir) return c.json({ error: "Not found" }, 404);
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
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const { type, status, feedback } = await c.req.json();

  if (!["Submitted", "Under Review", "Approved", "Returned"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const statusLabels: Record<string, string> = {
    "Approved": "approved",
    "Returned": "returned",
    "Under Review": "under_review",
    "Submitted": "submitted",
  };

  if (type === "pir") {
    const pir = await prisma.pIR.update({ where: { id }, data: { status }, include: { aip: { include: { program: true, school: true } } } });
    if (pir.created_by_user_id) {
      const schoolLabel = pir.aip.school?.name ?? "your school";
      const notifMessages: Record<string, { title: string; message: string }> = {
        "Approved": { title: "PIR Approved", message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel} has been approved.` },
        "Returned": { title: "PIR Returned", message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been returned for correction.${feedback ? ` Feedback: ${feedback}` : ""}` },
        "Under Review": { title: "PIR Under Review", message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) is now under review.` },
        "Submitted": { title: "PIR Status Updated", message: `Your PIR for ${pir.aip.program.title} (${pir.quarter}) status has been updated to Submitted.` },
      };
      const notif = notifMessages[status];
      if (notif) {
        await prisma.notification.create({
          data: { user_id: pir.created_by_user_id, title: notif.title, message: notif.message, type: statusLabels[status] },
        });
      }
    }
  } else {
    await prisma.aIP.update({ where: { id }, data: { status } });
  }

  await writeAuditLog(admin.id, `updated_${type}_status`, type === "pir" ? "PIR" : "AIP", id, {
    status,
    feedback: feedback ?? null,
  });

  return c.json({ success: true });
});

// ==========================================
// PIR REMARKS
// ==========================================

adminRoutes.patch("/pirs/:id/remarks", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const { remarks } = await c.req.json();

  if (typeof remarks !== "string") {
    return c.json({ error: "remarks must be a string" }, 400);
  }

  const pir = await prisma.pIR.update({
    where: { id },
    data: { remarks },
    include: { aip: { include: { program: true, school: true } } },
  });

  if (pir.created_by_user_id && remarks.trim()) {
    const schoolLabel = pir.aip.school?.name ?? "your school";
    await prisma.notification.create({
      data: {
        user_id: pir.created_by_user_id,
        title: "Remarks Added to Your PIR",
        message: `An admin has added remarks to your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel}.`,
        type: "remarked",
      },
    });
  }

  await writeAuditLog(admin.id, "update_remarks", "PIR", id, { remarks });

  return c.json({ success: true, remarks: pir.remarks });
});

// ==========================================
// USERS
// ==========================================

adminRoutes.get("/users", async (c) => {
  const search = c.req.query("search");
  const role = c.req.query("role");
  const status = c.req.query("status");

  const users = await prisma.user.findMany({
    where: {
      ...(role && role !== "All" && { role }),
      ...(status === "active" && { is_active: true }),
      ...(status === "disabled" && { is_active: false }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { school: { include: { cluster: true } }, programs: true },
    orderBy: { created_at: "desc" },
  });

  return c.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      school: u.school ? { id: u.school.id, name: u.school.name } : null,
      programs: u.programs.map((p) => ({ id: p.id, title: p.title })),
      created_at: u.created_at,
    }))
  );
});

adminRoutes.post("/users", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { name, email, password, role, school_id, program_ids } = await c.req.json();

  if (!name || !email || !password || !role) {
    return c.json({ error: "name, email, password, role are required" }, 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        ...(school_id && { school_id }),
        ...(program_ids?.length && {
          programs: { connect: program_ids.map((id: number) => ({ id })) },
        }),
      },
    });
    await writeAuditLog(admin.id, "created_user", "User", user.id, { name, email, role });
    return c.json({ id: user.id, email: user.email, role: user.role });
  } catch {
    return c.json({ error: "Email already exists" }, 409);
  }
});

adminRoutes.patch("/users/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const { name, role, school_id, program_ids, is_active } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  // Handle school_id carefully
  if (role === "School" && school_id !== undefined) {
    updateData.school_id = school_id;
  } else if (role === "Division Personnel" || role === "Admin") {
    updateData.school_id = null;
  }

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
});

adminRoutes.delete("/users/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));

  if (id === admin.id) return c.json({ error: "Cannot delete your own account" }, 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return c.json({ error: "Not found" }, 404);

  await prisma.user.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_user", "User", id, { email: user.email, role: user.role });
  return c.json({ success: true });
});

adminRoutes.post("/users/:id/reset-password", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));

  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const tempPassword = Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({ where: { id }, data: { password: hashed } });
  await writeAuditLog(admin.id, "reset_password", "User", id, {});

  return c.json({ temporaryPassword: tempPassword });
});

// ==========================================
// SCHOOLS & CLUSTERS
// ==========================================

adminRoutes.get("/clusters", async (c) => {
  const clusters = await prisma.cluster.findMany({
    include: {
      schools: {
        include: {
          aips: { select: { id: true, year: true, status: true } },
          user: { select: { id: true, email: true, name: true } },
          restricted_programs: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { cluster_number: "asc" },
  });
  return c.json(clusters);
});

adminRoutes.post("/clusters", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { cluster_number, name } = await c.req.json();
  const cluster = await prisma.cluster.create({ data: { cluster_number, name } });
  await writeAuditLog(admin.id, "created_cluster", "Cluster", cluster.id, { cluster_number, name });
  return c.json(cluster);
});

adminRoutes.patch("/clusters/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const cluster = await prisma.cluster.update({ where: { id }, data: body });
  await writeAuditLog(admin.id, "updated_cluster", "Cluster", id, body);
  return c.json(cluster);
});

adminRoutes.delete("/clusters/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const schoolCount = await prisma.school.count({ where: { cluster_id: id } });
  if (schoolCount > 0) {
    return c.json({ error: "Cannot delete a cluster that has schools assigned to it" }, 400);
  }
  await prisma.cluster.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_cluster", "Cluster", id, {});
  return c.json({ success: true });
});

adminRoutes.get("/schools", async (c) => {
  const clusterId = c.req.query("cluster") ? parseInt(c.req.query("cluster")!) : undefined;
  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      cluster: true,
      user: { select: { id: true, email: true, name: true } },
      restricted_programs: { select: { id: true, title: true } },
      aips: { select: { id: true, year: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
  return c.json(schools);
});

adminRoutes.post("/schools", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { name, level, cluster_id } = await c.req.json();
  const school = await prisma.school.create({ data: { name, level, cluster_id } });
  await writeAuditLog(admin.id, "created_school", "School", school.id, { name, level, cluster_id });
  return c.json(school);
});

adminRoutes.patch("/schools/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const { name, level, cluster_id } = body;
  const school = await prisma.school.update({
    where: { id },
    data: { ...(name && { name }), ...(level && { level }), ...(cluster_id && { cluster_id }) },
  });
  await writeAuditLog(admin.id, "updated_school", "School", id, body);
  return c.json(school);
});

adminRoutes.delete("/schools/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  await prisma.school.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_school", "School", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/schools/:id/restrictions", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
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
  const programs = await prisma.program.findMany({
    include: {
      personnel: { select: { id: true, name: true, email: true } },
      restricted_schools: { select: { id: true, name: true } },
      _count: { select: { aips: true } },
    },
    orderBy: { title: "asc" },
  });
  return c.json(programs);
});

adminRoutes.post("/programs", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { title, school_level_requirement } = await c.req.json();
  const program = await prisma.program.create({ data: { title, school_level_requirement } });
  await writeAuditLog(admin.id, "created_program", "Program", program.id, { title });
  return c.json(program);
});

adminRoutes.patch("/programs/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const program = await prisma.program.update({ where: { id }, data: body });
  await writeAuditLog(admin.id, "updated_program", "Program", id, body);
  return c.json(program);
});

adminRoutes.delete("/programs/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  await prisma.program.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_program", "Program", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/programs/:id/personnel", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  const { user_ids } = await c.req.json();
  await prisma.program.update({
    where: { id },
    data: { personnel: { set: user_ids.map((uid: number) => ({ id: uid })) } },
  });
  await writeAuditLog(admin.id, "updated_program_personnel", "Program", id, { user_ids });
  return c.json({ success: true });
});

// ==========================================
// DEADLINES
// ==========================================

adminRoutes.get("/deadlines", async (c) => {
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));
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
      isCustom: !!custom,
      id: custom?.id ?? null,
    };
  });
  return c.json(result);
});

adminRoutes.post("/deadlines", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { year, quarter, date } = await c.req.json();
  const existing = await prisma.deadline.findUnique({ where: { year_quarter: { year, quarter } } });
  const deadline = await prisma.deadline.upsert({
    where: { year_quarter: { year, quarter } },
    update: { date: new Date(date) },
    create: { year, quarter, date: new Date(date) },
  });
  await writeAuditLog(admin.id, "changed_deadline", "Deadline", deadline.id, {
    year, quarter, newDate: date, previousDate: existing?.date ?? null,
  });
  return c.json(deadline);
});

adminRoutes.delete("/deadlines/:id", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const id = parseInt(c.req.param("id"));
  await prisma.deadline.delete({ where: { id } });
  await writeAuditLog(admin.id, "reset_deadline", "Deadline", id, {});
  return c.json({ success: true });
});

adminRoutes.get("/deadlines/history", async (c) => {
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

adminRoutes.get("/reports/compliance", async (c) => {
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));
  const clusterId = c.req.query("cluster") ? parseInt(c.req.query("cluster")!) : undefined;

  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      aips: { where: { year }, include: { program: true } },
    },
    orderBy: { name: "asc" },
  });
  const programs = await prisma.program.findMany({ orderBy: { title: "asc" } });

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
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));
  const clusterId = c.req.query("cluster") ? parseInt(c.req.query("cluster")!) : undefined;

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
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));

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
  const personnel = await prisma.user.findMany({
    where: { role: "Division Personnel", is_active: true },
    include: {
      programs: true,
      aips: true,
      pirs: true,
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

adminRoutes.get("/reports/:type/export", async (c) => {
  const type = c.req.param("type");
  const format = c.req.query("format") || "csv";
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));

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
  }

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-report-${year}.csv"`,
      },
    });
  }

  return c.json({ data: rows, type, year });
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

adminRoutes.get("/announcements", async (c) => {
  const announcement = await prisma.announcement.findFirst({
    orderBy: { updated_at: "desc" },
  });
  return c.json(announcement ?? null);
});

adminRoutes.post("/announcements", async (c) => {
  const admin = getUserFromToken(c.req.header("Authorization"))!;
  const { message, type, is_active } = await c.req.json();

  // Upsert: only ever keep one announcement (update most recent or create new)
  const existing = await prisma.announcement.findFirst({ orderBy: { created_at: "desc" } });
  let announcement;
  if (existing) {
    announcement = await prisma.announcement.update({
      where: { id: existing.id },
      data: { message, type: type ?? "info", is_active: is_active ?? true },
    });
  } else {
    announcement = await prisma.announcement.create({
      data: { message, type: type ?? "info", is_active: is_active ?? true, created_by: admin.id },
    });
  }

  await writeAuditLog(admin.id, "updated_announcement", "Announcement", announcement.id, { message, type, is_active });
  return c.json(announcement);
});

// ==========================================
// AUDIT LOG
// ==========================================

adminRoutes.get("/audit-log", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
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

adminRoutes.get("/settings/system-info", async (c) => {
  const [userCount, schoolCount, programCount] = await Promise.all([
    prisma.user.count(),
    prisma.school.count(),
    prisma.program.count(),
  ]);
  return c.json({ userCount, schoolCount, programCount });
});

export default adminRoutes;
