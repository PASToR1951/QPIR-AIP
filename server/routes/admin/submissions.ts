import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { logger } from "../../lib/logger.ts";
import { pushNotification } from "../../lib/notifStream.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import { toCSV, toXLSX } from "./shared/exports.ts";
import {
  adminOnly,
  adminOrObserverOnly,
} from "./shared/guards.ts";
import { buildSubmissionFilters, parseExportFormat } from "./shared/params.ts";
import {
  AIP_SUBMISSION_INCLUDE,
  PIR_SUBMISSION_INCLUDE,
  SUBMISSION_DETAIL_AIP_INCLUDE,
  SUBMISSION_DETAIL_PIR_INCLUDE,
} from "./shared/prismaSelects.ts";

export const observerRoutes = new Hono();
export const adminRoutes = new Hono();

observerRoutes.use("/submissions", adminOrObserverOnly);
observerRoutes.use("/submissions/export", adminOrObserverOnly);
observerRoutes.use("/submissions/:id", adminOrObserverOnly);
observerRoutes.use("/submissions/:id/observer-notes", adminOrObserverOnly);

adminRoutes.use("/submissions/:id/status", adminOnly);
adminRoutes.use("/aips/:id/approve-edit", adminOnly);
adminRoutes.use("/aips/:id/deny-edit", adminOnly);
adminRoutes.use("/pirs/:id/remarks", adminOnly);
adminRoutes.use("/pirs/:id/presented", adminOnly);
adminRoutes.use("/pirs/:id/activity-notes", adminOnly);

observerRoutes.get("/submissions", async (c) => {
  try {
    const {
      type,
      page,
      limit,
      skip,
      aipWhere,
      pirWhere,
    } = buildSubmissionFilters(c);

    const [aipTotal, pirTotal] = await Promise.all([
      prisma.aIP.count({ where: aipWhere }),
      prisma.pIR.count({ where: pirWhere }),
    ]);

    let aips: unknown[] = [];
    if (!type || type === "aip" || type === "all") {
      aips = await prisma.aIP.findMany({
        where: aipWhere,
        skip: type === "aip" ? skip : 0,
        take: type === "aip" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: AIP_SUBMISSION_INCLUDE,
      });
    }

    let pirs: unknown[] = [];
    if (!type || type === "pir" || type === "all") {
      pirs = await prisma.pIR.findMany({
        where: pirWhere,
        skip: type === "pir" ? skip : 0,
        take: type === "pir" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: PIR_SUBMISSION_INCLUDE,
      });
    }

    const normalizedAIPs = (aips as Record<string, unknown>[]).map(
      (record: Record<string, unknown>) => {
        const aip = record as {
          id: number;
          status: string;
          year: number;
          created_at: Date;
          school?: {
            id: number;
            name: string;
            logo?: string | null;
            cluster?: {
              id: number;
              cluster_number: number;
              name: string;
              logo?: string | null;
            };
          } | null;
          program: { id: number; title: string };
          created_by?: {
            role?: string | null;
            name?: string | null;
            first_name?: string | null;
            middle_initial?: string | null;
            last_name?: string | null;
            email?: string;
          } | null;
        };

        return {
          id: aip.id,
          type: "AIP",
          status: aip.status,
          year: aip.year,
          quarter: null,
          schoolId: aip.school?.id ?? null,
          school: aip.school?.name ?? "Division",
          schoolLogo: aip.school?.logo ?? null,
          cluster: aip.school?.cluster
            ? `Cluster ${aip.school.cluster.cluster_number}`
            : "—",
          clusterId: aip.school?.cluster?.id ?? null,
          clusterNumber: aip.school?.cluster?.cluster_number ?? null,
          clusterLogo: aip.school?.cluster?.logo ?? null,
          program: aip.program.title,
          programId: aip.program.id,
          dateSubmitted: aip.created_at,
          submittedBy: buildSubmittedBy(aip.created_by),
        };
      },
    );

    const normalizedPIRs = (pirs as Record<string, unknown>[]).map(
      (record: Record<string, unknown>) => {
        const pir = record as {
          id: number;
          status: string;
          quarter: string;
          created_at: Date;
          remarks?: string | null;
          aip: {
            year: number;
            school?: {
              id: number;
              name: string;
              logo?: string | null;
              cluster?: {
                id: number;
                cluster_number: number;
                name: string;
                logo?: string | null;
              };
            } | null;
            program: { id: number; title: string };
          };
          created_by?: {
            role?: string | null;
            name?: string | null;
            first_name?: string | null;
            middle_initial?: string | null;
            last_name?: string | null;
            email?: string;
          } | null;
        };

        return {
          id: pir.id,
          type: "PIR",
          status: pir.status,
          year: pir.aip.year,
          quarter: pir.quarter,
          schoolId: pir.aip.school?.id ?? null,
          school: pir.aip.school?.name ?? "Division",
          schoolLogo: pir.aip.school?.logo ?? null,
          cluster: pir.aip.school?.cluster
            ? `Cluster ${pir.aip.school.cluster.cluster_number}`
            : "—",
          clusterId: pir.aip.school?.cluster?.id ?? null,
          clusterNumber: pir.aip.school?.cluster?.cluster_number ?? null,
          clusterLogo: pir.aip.school?.cluster?.logo ?? null,
          program: pir.aip.program.title,
          programId: pir.aip.program.id,
          dateSubmitted: pir.created_at,
          submittedBy: buildSubmittedBy(pir.created_by),
          has_remarks: !!(pir.remarks && pir.remarks.trim()),
        };
      },
    );

    const combined = [...normalizedAIPs, ...normalizedPIRs].sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime(),
    );

    const total = type === "aip"
      ? aipTotal
      : type === "pir"
      ? pirTotal
      : aipTotal + pirTotal;

    return c.json({
      data: type === "all" || (!type)
        ? combined.slice(skip, skip + limit)
        : combined,
      total,
      aipTotal,
      pirTotal,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    logger.error("GET /submissions error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

observerRoutes.get("/submissions/export", async (c) => {
  const exporter = getUserFromToken(c)!;
  const format = parseExportFormat(c.req.query("format"));
  const type = c.req.query("type");
  const year = c.req.query("year")
    ? safeParseInt(c.req.query("year"), 0)
    : undefined;
  const status = c.req.query("status");

  const aips = (!type || type === "aip" || type === "all")
    ? await prisma.aIP.findMany({
      where: {
        status: { not: "Draft" },
        ...(year && { year }),
        ...(status && { status }),
      },
      include: AIP_SUBMISSION_INCLUDE,
      orderBy: { created_at: "desc" },
    })
    : [];

  const pirs = (!type || type === "pir" || type === "all")
    ? await prisma.pIR.findMany({
      where: {
        status: { not: "Draft" },
        ...(status && { status }),
        aip: { ...(year && { year }) },
      },
      include: PIR_SUBMISSION_INCLUDE,
      orderBy: { created_at: "desc" },
    })
    : [];

  const rows = [
    ...aips.map((aip) => ({
      Type: "AIP",
      School: aip.school?.name ?? "Division",
      Cluster: aip.school?.cluster
        ? `Cluster ${aip.school.cluster.cluster_number}`
        : "—",
      Program: aip.program.title,
      Year: aip.year,
      Quarter: "—",
      Status: aip.status,
      "Date Submitted": aip.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(aip.created_by),
    })),
    ...pirs.map((pir) => ({
      Type: "PIR",
      School: pir.aip.school?.name ?? "Division",
      Cluster: pir.aip.school?.cluster
        ? `Cluster ${pir.aip.school.cluster.cluster_number}`
        : "—",
      Program: pir.aip.program.title,
      Year: pir.aip.year,
      Quarter: pir.quarter,
      Status: pir.status,
      "Date Submitted": pir.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(pir.created_by),
    })),
  ];

  await writeAuditLog(exporter.id, "exported_submissions", "Export", 0, {
    format,
    type: type ?? "all",
    year: year ?? "all",
    status: status ?? "all",
    row_count: rows.length,
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
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="submissions-export.xlsx"`,
      },
    });
  }

  return c.json(
    { error: "Unsupported export format. Use 'csv' or 'xlsx'." },
    400,
  );
});

observerRoutes.get("/submissions/:id", async (c) => {
  const actor = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const type = c.req.query("type") || "aip";

  if (type === "pir") {
    const pir = await prisma.pIR.findUnique({
      where: { id },
      include: SUBMISSION_DETAIL_PIR_INCLUDE,
    });
    if (!pir) return c.json({ error: "Not found" }, 404);

    await writeAuditLog(actor.id, "read_pir", "PIR", pir.id, {
      quarter: pir.quarter,
      actor_role: actor.role,
    });

    return c.json(pir);
  }

  const aip = await prisma.aIP.findUnique({
    where: { id },
    include: SUBMISSION_DETAIL_AIP_INCLUDE,
  });
  if (!aip) return c.json({ error: "Not found" }, 404);
  return c.json(aip);
});

observerRoutes.patch("/submissions/:id/observer-notes", async (c) => {
  const actor = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const type = typeof body.type === "string"
    ? body.type.toLowerCase()
    : c.req.query("type")?.toLowerCase();
  const notes = typeof body.notes === "string" ? body.notes : "";

  if (type !== "aip" && type !== "pir") {
    return c.json({ error: "type must be aip or pir" }, 400);
  }
  if (notes.length > 5000) {
    return c.json({ error: "Observer notes cannot exceed 5000 characters" }, 400);
  }

  if (type === "pir") {
    const existing = await prisma.pIR.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const pir = await prisma.pIR.update({
      where: { id },
      data: { observer_notes: notes } as any,
    });
    await writeAuditLog(actor.id, "updated_observer_notes", "PIR", id, {
      actor_role: actor.role,
      notes_length: notes.length,
    });

    return c.json({
      success: true,
      observer_notes: (pir as any).observer_notes ?? notes,
    });
  }

  const existing = await prisma.aIP.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return c.json({ error: "Not found" }, 404);

  const aip = await prisma.aIP.update({
    where: { id },
    data: { observer_notes: notes } as any,
  });
  await writeAuditLog(actor.id, "updated_observer_notes", "AIP", id, {
    actor_role: actor.role,
    notes_length: notes.length,
  });

  return c.json({
    success: true,
    observer_notes: (aip as any).observer_notes ?? notes,
  });
});

adminRoutes.patch("/submissions/:id/status", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { type, status, feedback } = sanitizeObject(await c.req.json());
  const normalizedFeedback = typeof feedback === "string"
    ? feedback.trim()
    : "";

  if (
    ![
      "Submitted",
      "Under Review",
      "For CES Review",
      "For Cluster Head Review",
      "Approved",
      "Returned",
    ].includes(status)
  ) {
    return c.json({ error: "Invalid status" }, 400);
  }
  if (normalizedFeedback.length > 5000) {
    return c.json({ error: "Feedback cannot exceed 5000 characters" }, 400);
  }
  if (type === "pir" && status === "Returned" && !normalizedFeedback) {
    return c.json({ error: "Feedback is required when returning a PIR" }, 400);
  }

  const statusLabels: Record<string, string> = {
    "Approved": "approved",
    "Returned": "returned",
    "Under Review": "under_review",
    "For CES Review": "for_ces_review",
    "For Cluster Head Review": "for_cluster_head_review",
    "Submitted": "submitted",
  };

  if (type === "pir") {
    const existingPir = await prisma.pIR.findUnique({
      where: { id },
      select: { remarks: true },
    });
    if (!existingPir) return c.json({ error: "Not found" }, 404);

    const existingRemarks = existingPir.remarks?.trim() ?? "";
    const mergedRemarks = !normalizedFeedback
      ? undefined
      : !existingRemarks || existingRemarks === normalizedFeedback ||
          existingRemarks.includes(normalizedFeedback)
      ? (existingRemarks || normalizedFeedback)
      : `${existingRemarks}\n\n${normalizedFeedback}`;

    const pir = await prisma.pIR.update({
      where: { id },
      data: {
        status,
        ...(mergedRemarks !== undefined ? { remarks: mergedRemarks } : {}),
      },
      include: { aip: { include: { program: true, school: true } } },
    });
    if (pir.created_by_user_id) {
      const schoolLabel = pir.aip.school?.name ?? "your school";
      const feedbackSuffix = normalizedFeedback
        ? ` Feedback: ${normalizedFeedback}`
        : "";
      const notifMessages: Record<string, { title: string; message: string }> = {
        "Approved": {
          title: "PIR Approved",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel} has been approved.${feedbackSuffix}`,
        },
        "Returned": {
          title: "PIR Returned",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been returned for correction.${feedbackSuffix}`,
        },
        "Under Review": {
          title: "PIR Under Review",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) is now under review.`,
        },
        "For CES Review": {
          title: "PIR Pending CES Review",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been sent for CES review.`,
        },
        "For Cluster Head Review": {
          title: "PIR Pending Cluster Head Review",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) has been sent for Cluster Head review.`,
        },
        "Submitted": {
          title: "PIR Status Updated",
          message:
            `Your PIR for ${pir.aip.program.title} (${pir.quarter}) status has been updated to Submitted.`,
        },
      };
      const notification = notifMessages[status];
      if (notification) {
        const created = await prisma.notification.create({
          data: {
            user_id: pir.created_by_user_id,
            title: notification.title,
            message: notification.message,
            type: statusLabels[status],
            entity_id: pir.id,
            entity_type: "pir",
          },
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
      const aipNotifMessages: Record<string, { title: string; message: string }> =
        {
          "Approved": {
            title: "AIP Approved",
            message:
              `Your AIP for ${aip.program.title} (FY ${aip.year}) from ${schoolLabel} has been approved.`,
          },
          "Returned": {
            title: "AIP Returned",
            message:
              `Your AIP for ${aip.program.title} (FY ${aip.year}) has been returned for correction.${
                feedback ? ` Feedback: ${feedback}` : ""
              }`,
          },
        };
      const notification = aipNotifMessages[status];
      if (notification) {
        const created = await prisma.notification.create({
          data: {
            user_id: aip.created_by_user_id,
            title: notification.title,
            message: notification.message,
            type: statusLabels[status],
            entity_id: aip.id,
            entity_type: "aip",
          },
        });
        pushNotification(created);
      }
    }
  }

  await writeAuditLog(
    admin.id,
    `updated_${type}_status`,
    type === "pir" ? "PIR" : "AIP",
    id,
    {
      status,
      feedback: normalizedFeedback || null,
    },
  );

  return c.json({ success: true });
});

adminRoutes.patch("/aips/:id/approve-edit", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false, status: "Returned" },
    include: { program: true, school: true },
  });
  if (aip.created_by_user_id) {
    const notification = await prisma.notification.create({
      data: {
        user_id: aip.created_by_user_id,
        title: "Edit Request Approved",
        message:
          `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been approved. You may now edit and resubmit.`,
        type: "aip_edit_approved",
        entity_id: aip.id,
        entity_type: "aip",
      },
    });
    pushNotification(notification);
  }
  await writeAuditLog(admin.id, "approved_aip_edit_request", "AIP", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/aips/:id/deny-edit", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false },
    include: { program: true, school: true },
  });
  if (aip.created_by_user_id) {
    const notification = await prisma.notification.create({
      data: {
        user_id: aip.created_by_user_id,
        title: "Edit Request Denied",
        message:
          `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been denied.`,
        type: "aip_edit_denied",
        entity_id: aip.id,
        entity_type: "aip",
      },
    });
    pushNotification(notification);
  }
  await writeAuditLog(admin.id, "denied_aip_edit_request", "AIP", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/pirs/:id/remarks", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { remarks } = sanitizeObject(await c.req.json());

  if (typeof remarks !== "string") {
    return c.json({ error: "remarks must be a string" }, 400);
  }
  if (remarks.length > 5000) {
    return c.json({ error: "Remarks cannot exceed 5000 characters" }, 400);
  }

  const pir = await prisma.pIR.update({
    where: { id },
    data: { remarks },
    include: { aip: { include: { program: true, school: true } } },
  });

  if (pir.created_by_user_id && remarks.trim()) {
    const schoolLabel = pir.aip.school?.name ?? "your school";
    const notification = await prisma.notification.create({
      data: {
        user_id: pir.created_by_user_id,
        title: "Remarks Added to Your PIR",
        message:
          `An admin has added remarks to your PIR for ${pir.aip.program.title} (${pir.quarter}) from ${schoolLabel}.`,
        type: "remarked",
        entity_id: pir.id,
        entity_type: "pir",
      },
    });
    pushNotification(notification);
  }

  await writeAuditLog(admin.id, "update_remarks", "PIR", id, { remarks });
  return c.json({ success: true, remarks: pir.remarks });
});

adminRoutes.patch("/pirs/:id/presented", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);

  const pir = await prisma.pIR.findUnique({ where: { id } });
  if (!pir) return c.json({ error: "PIR not found" }, 404);

  const updated = await prisma.pIR.update({
    where: { id },
    data: { presented: !pir.presented },
  });

  await writeAuditLog(admin.id, "toggle_presented", "PIR", id, {
    presented: updated.presented,
  });

  return c.json({ success: true, presented: updated.presented });
});

adminRoutes.patch("/pirs/:id/activity-notes", async (c) => {
  const admin = getUserFromToken(c)!;
  const pirId = safeParseInt(c.req.param("id"), 0);
  const { activity_review_id, notes } = sanitizeObject(await c.req.json());

  if (!activity_review_id || typeof notes !== "string") {
    return c.json({ error: "activity_review_id and notes are required" }, 400);
  }
  if (notes.length > 5000) {
    return c.json({ error: "Notes cannot exceed 5000 characters" }, 400);
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
