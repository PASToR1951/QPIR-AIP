import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { logger } from "../lib/logger.ts";
import { getUserFromToken } from "../lib/auth.ts";
import { writeUserLog } from "../lib/userActivityLog.ts";
import { getClientIp } from "../lib/clientIp.ts";
import { sanitizeString } from "../lib/sanitize.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";
import {
  PROFILE_PHOTO_EXTENSION,
  PROFILE_PHOTO_MIME_TYPES,
  processToWebp,
} from "../lib/profilePhoto.ts";

const profileRoutes = new Hono();

// Profile photos are personal data (RA 10173) — stored OUTSIDE ./public so they
// are never reachable via a static URL. They are streamed only through the
// auth-gated GET /api/profile/photo/:id handler below. Every upload is
// normalized to a single WebP file; the legacy extensions are listed only so
// cleanup removes any pre-normalization files left on disk.
const PROFILE_PHOTO_DIR = "./private/profile-photos";
const PHOTO_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "gif"];
const PHOTO_CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

async function removeExistingPhotoFiles(userId: number) {
  await Promise.all(
    PHOTO_EXTENSIONS.map(async (extension) => {
      try {
        await Deno.remove(`${PROFILE_PHOTO_DIR}/${userId}.${extension}`);
      } catch {
        // Missing files are fine — cleanup before replacing or removing a photo.
      }
    }),
  );
}

async function findPhotoFile(userId: number) {
  for (const extension of PHOTO_EXTENSIONS) {
    const path = `${PROFILE_PHOTO_DIR}/${userId}.${extension}`;
    try {
      const stat = await Deno.stat(path);
      if (stat.isFile) return { path, extension };
    } catch {
      // try next extension
    }
  }
  return null;
}

function composeFullName(
  first: string,
  middle: string,
  last: string,
): string {
  const safeMiddle = middle.trim().charAt(0);
  const parts = safeMiddle
    ? [first.trim(), `${safeMiddle}.`, last.trim()]
    : [first.trim(), last.trim()];
  return parts.filter(Boolean).join(" ").trim();
}

// GET /api/profile — the signed-in user's own editable profile + photo + any
// pending school/cluster change request. Acts on the token user's id only.
profileRoutes.get("/", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      include: { school: { include: { cluster: true } }, cluster: true },
    });
    if (!user || !user.is_active) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const pendingRequest = await prisma.profileChangeRequest.findFirst({
      where: { user_id: user.id, status: "Pending" },
      orderBy: { created_at: "desc" },
    });

    return c.json({
      id: user.id,
      email: user.email, // read-only — login identity
      role: user.role, // read-only
      salutation: user.salutation,
      name: user.name,
      first_name: user.first_name,
      middle_initial: user.middle_initial,
      last_name: user.last_name,
      position: user.position,
      profile_photo: user.profile_photo,
      school_id: user.school_id,
      school_name: user.school?.name ?? null,
      cluster_id: user.school?.cluster_id ?? user.cluster_id ?? null,
      cluster_number: user.school?.cluster?.cluster_number ??
        user.cluster?.cluster_number ?? null,
      pending_change_request: pendingRequest
        ? {
          id: pendingRequest.id,
          requested_school_id: pendingRequest.requested_school_id,
          requested_cluster_id: pendingRequest.requested_cluster_id,
          reason: pendingRequest.reason,
          created_at: pendingRequest.created_at,
        }
        : null,
    });
  } catch (error) {
    logger.error("GET /profile failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /api/profile — update the user's signatory identity. Email/role/school
// are intentionally NOT accepted here (login identity + access scope).
profileRoutes.patch("/", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json().catch(() => ({}));

    const first_name = sanitizeString(body.first_name ?? "").trim();
    const last_name = sanitizeString(body.last_name ?? "").trim();
    if (!first_name || !last_name) {
      return c.json({ error: "First name and last name are required." }, 400);
    }

    const middle_initial = sanitizeString(body.middle_initial ?? "").trim()
      .charAt(0);
    const salutationRaw = sanitizeString(body.salutation ?? "").trim();
    const position = sanitizeString(body.position ?? "").trim();

    const data = {
      salutation: salutationRaw || null,
      first_name,
      middle_initial: middle_initial || null,
      last_name,
      position: position || null,
      name: composeFullName(first_name, middle_initial, last_name),
    };

    const updated = await prisma.user.update({
      where: { id: tokenUser.id },
      data,
      select: {
        salutation: true,
        name: true,
        first_name: true,
        middle_initial: true,
        last_name: true,
        position: true,
      },
    });

    writeUserLog({
      userId: tokenUser.id,
      action: "updated_profile",
      entityType: "User",
      entityId: tokenUser.id,
      details: { fields: Object.keys(data) },
      ipAddress: getClientIp(c),
    });

    return c.json(updated);
  } catch (error) {
    logger.error("PATCH /profile failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/profile/photo — multipart upload, mirrors the school-logo handler
// (MIME allowlist + 2 MB cap) and additionally strips JPEG metadata.
profileRoutes.post("/photo", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return c.json({ error: "Missing photo file" }, 400);
  }

  if (!PROFILE_PHOTO_MIME_TYPES.has(file.type)) {
    return c.json({
      error: "Photo must be a PNG, JPEG, or WebP image",
    }, 400);
  }
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: "Photo must be 2 MB or smaller" }, 400);
  }

  // Re-encode to WebP (also strips all metadata). Reject anything that fails to
  // decode — a corrupt file or a disallowed format with a spoofed MIME type.
  let webpBytes: Uint8Array;
  try {
    const raw = new Uint8Array(await file.arrayBuffer());
    webpBytes = await processToWebp(raw, file.type);
  } catch (error) {
    logger.warn("Profile photo could not be processed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json(
      { error: "Could not process that image. Please try a different file." },
      400,
    );
  }

  try {
    await Deno.mkdir(PROFILE_PHOTO_DIR, { recursive: true });
    await removeExistingPhotoFiles(tokenUser.id);

    await Deno.writeFile(
      `${PROFILE_PHOTO_DIR}/${tokenUser.id}.${PROFILE_PHOTO_EXTENSION}`,
      webpBytes,
    );

    // Stored value points at the auth-gated serving route, with a cache-buster.
    const photoPath = `/api/profile/photo/${tokenUser.id}?v=${Date.now()}`;
    await prisma.user.update({
      where: { id: tokenUser.id },
      data: { profile_photo: photoPath },
    });

    writeUserLog({
      userId: tokenUser.id,
      action: "uploaded_profile_photo",
      entityType: "User",
      entityId: tokenUser.id,
      details: {},
      ipAddress: getClientIp(c),
    });

    return c.json({ profile_photo: photoPath });
  } catch (error) {
    logger.error("POST /profile/photo failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/profile/photo — remove the file and clear the column.
profileRoutes.delete("/photo", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  try {
    await removeExistingPhotoFiles(tokenUser.id);
    await prisma.user.update({
      where: { id: tokenUser.id },
      data: { profile_photo: null },
    });

    writeUserLog({
      userId: tokenUser.id,
      action: "removed_profile_photo",
      entityType: "User",
      entityId: tokenUser.id,
      details: {},
      ipAddress: getClientIp(c),
    });

    return c.json({ profile_photo: null });
  } catch (error) {
    logger.error("DELETE /profile/photo failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/profile/photo/:id — auth-gated photo serving. Any signed-in user may
// view a profile photo (org-internal directory); anonymous requests get 401.
profileRoutes.get("/photo/:id", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  const found = await findPhotoFile(id);
  if (!found) return c.json({ error: "Photo not found" }, 404);

  try {
    const fileBytes = await Deno.readFile(found.path);
    return new Response(fileBytes, {
      headers: {
        "Content-Type": PHOTO_CONTENT_TYPES[found.extension] ??
          "application/octet-stream",
        // Personal data: allow only private caching by the requesting client.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    logger.error("GET /profile/photo/:id failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/profile/school-options — minimal school list (id + name + cluster) for
// the transfer-request picker. Data-minimized: no enrolment/sensitive fields.
profileRoutes.get("/school-options", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      cluster_id: true,
      cluster: { select: { cluster_number: true } },
    },
  });

  return c.json(
    schools.map((s) => ({
      id: s.id,
      name: s.name,
      cluster_id: s.cluster_id,
      cluster_number: s.cluster?.cluster_number ?? null,
    })),
  );
});

// POST /api/profile/school-change-request — record a Pending request. Does NOT
// mutate the user's school/cluster; an admin must approve it (no self-escalation).
profileRoutes.post("/school-change-request", async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json().catch(() => ({}));
    const requestedSchoolId = body.requested_school_id != null
      ? safeParseInt(String(body.requested_school_id), 0)
      : null;
    const requestedClusterId = body.requested_cluster_id != null
      ? safeParseInt(String(body.requested_cluster_id), 0)
      : null;
    const reason = sanitizeString(body.reason ?? "").trim();

    if (!requestedSchoolId && !requestedClusterId) {
      return c.json(
        { error: "A target school or cluster is required." },
        400,
      );
    }

    // Validate the target school exists, and derive its cluster.
    let resolvedClusterId = requestedClusterId || null;
    if (requestedSchoolId) {
      const school = await prisma.school.findUnique({
        where: { id: requestedSchoolId },
      });
      if (!school) return c.json({ error: "Selected school not found." }, 404);
      resolvedClusterId = school.cluster_id ?? resolvedClusterId;
    }

    // One pending request at a time — supersede any existing pending one.
    await prisma.profileChangeRequest.updateMany({
      where: { user_id: tokenUser.id, status: "Pending" },
      data: { status: "Rejected", reviewed_at: new Date() },
    });

    const request = await prisma.profileChangeRequest.create({
      data: {
        user_id: tokenUser.id,
        requested_school_id: requestedSchoolId || null,
        requested_cluster_id: resolvedClusterId,
        reason: reason || null,
        status: "Pending",
      },
    });

    writeUserLog({
      userId: tokenUser.id,
      action: "requested_school_change",
      entityType: "ProfileChangeRequest",
      entityId: request.id,
      details: {
        requested_school_id: requestedSchoolId,
        requested_cluster_id: resolvedClusterId,
      },
      ipAddress: getClientIp(c),
    });

    return c.json({ id: request.id, status: request.status });
  } catch (error) {
    logger.error("POST /profile/school-change-request failed", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default profileRoutes;
