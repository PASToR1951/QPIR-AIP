import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { getClientIp } from "../lib/clientIp.ts";
import { writeUserLog } from "../lib/userActivityLog.ts";
import { pushNotifications } from "../lib/notifStream.ts";
import { asyncHandler } from "./data/shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./data/shared/guards.ts";
import { createSessionCookie } from "../lib/userSessions.ts";

const onboardingRoutes = new Hono();

// Require a valid session cookie for all onboarding routes
onboardingRoutes.use("/*", requireAuth());

// GET /lookups - Fetch dropdown data for the onboarding wizard
onboardingRoutes.get(
  "/lookups",
  asyncHandler("Unhandled route error", "Failed to fetch lookups", async (c) => {
    const tokenUser = getAuthedUser(c);
    
    // Only allow Pending users to access onboarding lookups
    if (tokenUser.role !== "Pending") {
      return c.json({ error: "Forbidden. User is not pending." }, 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: { first_name: true, last_name: true, email: true }
    });

    // Fetch schools (grouped by cluster on frontend)
    const schools = await prisma.school.findMany({
      include: { cluster: true },
      orderBy: [
        { cluster: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Fetch division-level programs
    const programs = await prisma.program.findMany({
      where: { school_level_requirement: "Division" },
      orderBy: { title: "asc" },
    });

    return c.json({
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        abbreviation: s.abbreviation,
        level: s.level,
        cluster_id: s.cluster_id,
        cluster_name: s.cluster?.name || "Unclustered"
      })),
      programs: programs.map(p => ({
        id: p.id,
        title: p.title,
        division: p.division,
        school_level_requirement: p.school_level_requirement
      })),
      divisions: ["SGOD", "CID", "OSDS"],
      profile_hints: {
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || ""
      }
    });
  })
);

// POST /complete-profile - Submit wizard and activate account
onboardingRoutes.post(
  "/complete-profile",
  asyncHandler("Unhandled route error", "Failed to complete profile", async (c) => {
    const tokenUser = getAuthedUser(c);
    if (tokenUser.role !== "Pending") {
      return c.json({ error: "Forbidden. User is already active or not pending." }, 403);
    }

    const body = await c.req.json();
    const {
      user_type,
      salutation,
      first_name,
      middle_initial,
      last_name,
      position,
      school_id,
      program_ids
    } = body;

    // 1. Basic validation
    if (!["School", "Division Personnel"].includes(user_type)) {
      return c.json({ error: "Invalid user type selected." }, 400);
    }
    if (!first_name?.trim() || !last_name?.trim()) {
      return c.json({ error: "First name and last name are required." }, 400);
    }

    // 2. Validate school for School users
    let finalSchoolId = null;
    let finalClusterId = null;
    
    if (user_type === "School") {
      if (!school_id) {
        return c.json({ error: "School assignment is required." }, 400);
      }
      const school = await prisma.school.findUnique({ where: { id: Number(school_id) } });
      if (!school) {
        return c.json({ error: "Selected school not found." }, 404);
      }
      finalSchoolId = school.id;
      finalClusterId = school.cluster_id;
    }

    // 3. Validate programs for Division Personnel
    let validProgramIds: number[] = [];
    if (user_type === "Division Personnel" && Array.isArray(program_ids) && program_ids.length > 0) {
      const programs = await prisma.program.findMany({
        where: { 
          id: { in: program_ids.map(Number) },
          school_level_requirement: "Division"
        }
      });
      validProgramIds = programs.map(p => p.id);
    }

    // 4. Prepare data
    const safeMiddle = middle_initial?.trim().charAt(0) || "";
    const fullName = safeMiddle 
      ? `${first_name.trim()} ${safeMiddle}. ${last_name.trim()}`
      : `${first_name.trim()} ${last_name.trim()}`;

    // 5. Transaction: Update user and assign focal person roles
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Clear existing programs just in case (though should be none for a pending user)
      await tx.user.update({
        where: { id: tokenUser.id },
        data: { programs: { set: [] } }
      });
      await tx.programFocalPerson.deleteMany({
        where: { user_id: tokenUser.id }
      });

      // Connect new programs
      const programsConnect = validProgramIds.map(id => ({ id }));
      
      const user = await tx.user.update({
        where: { id: tokenUser.id },
        data: {
          role: user_type,
          is_active: true, // Auto-activate
          salutation: salutation?.trim() || null,
          first_name: first_name.trim(),
          middle_initial: safeMiddle || null,
          last_name: last_name.trim(),
          position: position?.trim() || null,
          name: fullName,
          school_id: finalSchoolId,
          cluster_id: finalClusterId,
          programs: { connect: programsConnect }
        },
        include: {
          school: { include: { cluster: true } }
        }
      });

      // Create FocalPerson entries
      if (validProgramIds.length > 0) {
        await tx.programFocalPerson.createMany({
          data: validProgramIds.map(programId => ({
            program_id: programId,
            user_id: user.id
          }))
        });
      }

      // Write audit log
      await tx.auditLog.create({
        data: {
          action: "user_self_registered",
          entity_type: "User",
          entity_id: user.id.toString(),
          actor_user_id: user.id,
          actor_name: user.name ?? user.email,
          actor_email: user.email,
          ip_address: getClientIp(c) || "Unknown",
          details: JSON.stringify({
            role: user.role,
            school_id: user.school_id,
            program_ids: validProgramIds
          })
        }
      });

      // Notify all active Admins
      const admins = await tx.user.findMany({
        where: { role: "Admin", is_active: true }
      });
      
      if (admins.length > 0) {
        const notifs = await tx.notification.createManyAndReturn({
          data: admins.map(admin => ({
            user_id: admin.id,
            title: "New User Registered",
            message: `${user.name} (${user.email}) self-registered as ${user.role}.`,
            icon_key: "UserPlus",
            link: `/admin/users`, // They can click this to view the users list
            is_read: false
          }))
        });
        pushNotifications(notifs);
      }

      return user;
    });

    // 6. User Activity Log
    writeUserLog({
      userId: updatedUser.id,
      action: "self_registration",
      details: { role: updatedUser.role },
      ipAddress: getClientIp(c)
    });

    // 7. Update Session Cookie
    const expiresAt = await createSessionCookie(c, updatedUser);

    return c.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        school_id: updatedUser.school_id,
        cluster_id: updatedUser.cluster_id,
        cluster_name: updatedUser.school?.cluster?.name ?? null,
        cluster_logo: updatedUser.school?.cluster?.logo ?? null,
        school_logo: updatedUser.school?.logo ?? null,
        must_change_password: updatedUser.must_change_password,
        needs_onboarding: false
      },
      expiresAt
    });
  })
);

export default onboardingRoutes;
