import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { logger } from "../../lib/logger.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly, requireAdmin } from "./shared/guards.ts";

const profileChangeRequestRoutes = new Hono();

profileChangeRequestRoutes.use("/profile-change-requests", adminOnly);
profileChangeRequestRoutes.use("/profile-change-requests/*", adminOnly);

// GET /api/admin/profile-change-requests — list pending requests for review.
profileChangeRequestRoutes.get("/profile-change-requests", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  const status = c.req.query("status") ?? "Pending";
  const requests = await prisma.profileChangeRequest.findMany({
    where: { status },
    orderBy: { created_at: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          school_id: true,
          cluster_id: true,
          school: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Resolve the requested school/cluster names for display.
  const schoolIds = requests
    .map((r) => r.requested_school_id)
    .filter((id): id is number => id != null);
  const clusterIds = requests
    .map((r) => r.requested_cluster_id)
    .filter((id): id is number => id != null);

  const [schools, clusters] = await Promise.all([
    schoolIds.length
      ? prisma.school.findMany({
        where: { id: { in: schoolIds } },
        select: { id: true, name: true },
      })
      : Promise.resolve([]),
    clusterIds.length
      ? prisma.cluster.findMany({
        where: { id: { in: clusterIds } },
        select: { id: true, cluster_number: true },
      })
      : Promise.resolve([]),
  ]);
  const schoolName = new Map(schools.map((s) => [s.id, s.name]));
  const clusterNumber = new Map(clusters.map((c) => [c.id, c.cluster_number]));

  return c.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      created_at: r.created_at,
      user: r.user,
      requested_school_id: r.requested_school_id,
      requested_school_name: r.requested_school_id != null
        ? schoolName.get(r.requested_school_id) ?? null
        : null,
      requested_cluster_id: r.requested_cluster_id,
      requested_cluster_number: r.requested_cluster_id != null
        ? clusterNumber.get(r.requested_cluster_id) ?? null
        : null,
    })),
  });
});

// POST /api/admin/profile-change-requests/:id/decision { decision: "approve" | "reject" }
// Approve applies ONLY user.school_id/cluster_id — existing AIP/PIR records keep
// their own school_id so a school's history stays with the school, not the person.
profileChangeRequestRoutes.post(
  "/profile-change-requests/:id/decision",
  async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const id = safeParseInt(c.req.param("id"), 0);
    if (!id) return c.json({ error: "Invalid request ID" }, 400);

    const body = await c.req.json().catch(() => ({}));
    const decision = body.decision;
    if (decision !== "approve" && decision !== "reject") {
      return c.json(
        { error: "decision must be 'approve' or 'reject'" },
        400,
      );
    }

    const request = await prisma.profileChangeRequest.findUnique({
      where: { id },
    });
    if (!request) return c.json({ error: "Request not found" }, 404);
    if (request.status !== "Pending") {
      return c.json({ error: "Request has already been decided" }, 409);
    }

    try {
      if (decision === "reject") {
        await prisma.profileChangeRequest.update({
          where: { id },
          data: {
            status: "Rejected",
            reviewed_by: admin.id,
            reviewed_at: new Date(),
          },
        });
        await writeAuditLog(
          admin.id,
          "rejected_profile_change_request",
          "ProfileChangeRequest",
          id,
          { user_id: request.user_id },
          { ctx: c },
        );
        return c.json({ status: "Rejected" });
      }

      // Approve: update ONLY the user's assignment — never touch existing records.
      await prisma.$transaction([
        prisma.user.update({
          where: { id: request.user_id },
          data: {
            school_id: request.requested_school_id,
            cluster_id: request.requested_cluster_id,
          },
        }),
        prisma.profileChangeRequest.update({
          where: { id },
          data: {
            status: "Approved",
            reviewed_by: admin.id,
            reviewed_at: new Date(),
          },
        }),
      ]);

      await writeAuditLog(
        admin.id,
        "approved_profile_change_request",
        "ProfileChangeRequest",
        id,
        {
          user_id: request.user_id,
          school_id: request.requested_school_id,
          cluster_id: request.requested_cluster_id,
        },
        { ctx: c },
      );
      return c.json({ status: "Approved" });
    } catch (error) {
      logger.error("POST /profile-change-requests/:id/decision failed", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

export default profileChangeRequestRoutes;
