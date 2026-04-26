import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import {
  hashSessionToken,
  revokeAllUserSessions,
  revokeSessionById,
} from "../../lib/userSessions.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import { adminOnly } from "./shared/guards.ts";
import { parsePositiveInt } from "./shared/params.ts";

const sessionsRoutes = new Hono();

sessionsRoutes.use("/sessions", adminOnly);
sessionsRoutes.use("/sessions/*", adminOnly);

function buildUserWhere(search: string | undefined, role: string | undefined) {
  const userWhere = {
    ...(role ? { role } : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { first_name: { contains: search, mode: "insensitive" as const } },
          { last_name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  return Object.keys(userWhere).length > 0 ? { user: { is: userWhere } } : {};
}

function buildDeviceWhere(device: string | undefined) {
  if (!device) return {};
  return {
    OR: [
      { device_label: { contains: device, mode: "insensitive" as const } },
      ...(device.toLowerCase().includes("unknown")
        ? [{ device_label: null }]
        : []),
    ],
  };
}

function buildStatusWhere(status: string | undefined) {
  const now = new Date();

  switch (status) {
    case "active":
      return {
        revoked_at: null,
        expires_at: { gt: now },
      };
    case "expired":
      return {
        revoked_at: null,
        expires_at: { lte: now },
      };
    case "revoked":
      return {
        revoked_at: { not: null },
      };
    default:
      return {};
  }
}

function serializeAdminSession(
  session: {
    id: number;
    device_label: string | null;
    ip_address: string | null;
    created_at: Date;
    last_seen_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
    session_token: string;
    user: {
      id: number;
      role: string;
      email: string;
      name: string | null;
      first_name: string | null;
      middle_initial: string | null;
      last_name: string | null;
    };
  },
  currentSessionToken: string | null,
) {
  return {
    id: session.id,
    user: {
      id: session.user.id,
      name: buildSubmittedBy(session.user),
      email: session.user.email,
      role: session.user.role,
    },
    device_label: session.device_label ?? "Unknown device",
    ip_address: session.ip_address,
    created_at: session.created_at.toISOString(),
    last_seen_at: session.last_seen_at.toISOString(),
    expires_at: session.expires_at.toISOString(),
    revoked_at: session.revoked_at?.toISOString() ?? null,
    is_current: currentSessionToken === session.session_token,
  };
}

sessionsRoutes.get("/sessions", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const currentSessionToken = admin.sid
    ? await hashSessionToken(admin.sid)
    : null;
  const search = c.req.query("search")?.trim();
  const role = c.req.query("role")?.trim();
  const device = c.req.query("device")?.trim();
  const userId = parsePositiveInt(c.req.query("userId"));
  const status = c.req.query("status");
  const page = parsePositiveInt(c.req.query("page"));
  const limit = Math.min(100, parsePositiveInt(c.req.query("limit")) ?? 25);

  const where = {
    ...(userId ? { user_id: userId } : {}),
    ...buildStatusWhere(status),
    ...buildUserWhere(search, role),
    ...buildDeviceWhere(device),
  };

  const shouldPaginate = Boolean(page);
  const sessions = await prisma.userSession.findMany({
    where,
    orderBy: [{ last_seen_at: "desc" }, { created_at: "desc" }],
    ...(shouldPaginate ? { skip: ((page ?? 1) - 1) * limit, take: limit } : {}),
    select: {
      id: true,
      device_label: true,
      ip_address: true,
      created_at: true,
      last_seen_at: true,
      expires_at: true,
      revoked_at: true,
      session_token: true,
      user: {
        select: {
          id: true,
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
  const total = shouldPaginate
    ? await prisma.userSession.count({ where })
    : null;

  if (shouldPaginate) {
    c.header("X-Page", String(page ?? 1));
    c.header("X-Page-Size", String(limit));
    c.header("X-Total-Count", String(total ?? sessions.length));
  }

  return c.json(
    sessions.map((session) =>
      serializeAdminSession(session, currentSessionToken)
    ),
  );
});

sessionsRoutes.delete("/sessions/user/:userId", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const userId = safeParseInt(c.req.param("userId"), 0);
  if (!userId) return c.json({ error: "Invalid user id" }, 400);

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  if (!user) return c.json({ error: "User not found" }, 404);

  const shouldKeepCurrentSession = userId === admin.id;
  const revoked = await revokeAllUserSessions(userId, {
    revokedBy: admin.id,
    exceptSid: shouldKeepCurrentSession ? admin.sid : null,
  });
  await writeAuditLog(admin.id, "revoked_user_sessions", "User", userId, {
    revoked_count: revoked,
    target_email: user.email,
    target_name: buildSubmittedBy(user),
    current_session_skipped: shouldKeepCurrentSession,
  }, { ctx: c });

  return c.json({ revoked, currentSessionSkipped: shouldKeepCurrentSession });
});

sessionsRoutes.delete("/sessions/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid session id" }, 400);

  const session = await prisma.userSession.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
      device_label: true,
      ip_address: true,
      revoked_at: true,
      session_token: true,
      user: {
        select: {
          id: true,
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
  if (!session) return c.json({ error: "Session not found" }, 404);

  if (admin.sid) {
    const currentSessionToken = await hashSessionToken(admin.sid);
    if (session.session_token === currentSessionToken) {
      return c.json(
        { error: "Use logout to end the current device session." },
        400,
      );
    }
  }

  if (!session.revoked_at) {
    await revokeSessionById(session.id, admin.id);
  }

  await writeAuditLog(admin.id, "revoked_session", "UserSession", session.id, {
    user_id: session.user_id,
    user_email: session.user.email,
    user_name: buildSubmittedBy(session.user),
    device_label: session.device_label ?? "Unknown device",
    ip_address: session.ip_address,
    already_revoked: Boolean(session.revoked_at),
  }, { ctx: c });

  return c.json({ success: true });
});

export default sessionsRoutes;
