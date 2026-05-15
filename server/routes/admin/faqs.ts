import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly } from "./shared/guards.ts";
import {
  DEFAULT_FAQS,
  isSupportedIcon,
  SUPPORTED_FAQ_ICONS,
} from "../../lib/faqDefaults.ts";

const faqsAdminRoutes = new Hono();

const MAX_TEXT_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 80;

faqsAdminRoutes.use("/faqs", adminOnly);
faqsAdminRoutes.use("/faqs/*", adminOnly);

function validatePayload(payload: {
  category?: unknown;
  question?: unknown;
  answer?: unknown;
  icon_key?: unknown;
}): string | null {
  const { category, question, answer, icon_key } = payload;
  if (typeof category !== "string" || category.trim().length === 0) {
    return "Category is required";
  }
  if (category.length > MAX_CATEGORY_LENGTH) {
    return `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters`;
  }
  if (typeof question !== "string" || question.trim().length === 0) {
    return "Question is required";
  }
  if (question.length > MAX_TEXT_LENGTH) {
    return `Question cannot exceed ${MAX_TEXT_LENGTH} characters`;
  }
  if (typeof answer !== "string" || answer.trim().length === 0) {
    return "Answer is required";
  }
  if (answer.length > MAX_TEXT_LENGTH) {
    return `Answer cannot exceed ${MAX_TEXT_LENGTH} characters`;
  }
  if (icon_key !== undefined && !isSupportedIcon(icon_key)) {
    return "Unsupported icon";
  }
  return null;
}

// GET /api/admin/faqs — flat admin listing, all rows (including inactive)
faqsAdminRoutes.get("/faqs", async (c) => {
  const items = await (prisma as any).faqItem.findMany({
    orderBy: [{ category: "asc" }, { sort_order: "asc" }, { id: "asc" }],
  });
  return c.json({
    items,
    supportedIcons: SUPPORTED_FAQ_ICONS,
  });
});

// POST /api/admin/faqs — create a new FAQ item
faqsAdminRoutes.post("/faqs", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json()) as Record<string, unknown>;
  const error = validatePayload(body);
  if (error) return c.json({ error }, 400);

  const category = (body.category as string).trim();
  const question = (body.question as string).trim();
  const answer = (body.answer as string).trim();
  const icon_key = isSupportedIcon(body.icon_key)
    ? (body.icon_key as string)
    : "HelpCircle";

  // Append after the highest sort_order in the same category.
  const last = await (prisma as any).faqItem.findFirst({
    where: { category },
    orderBy: { sort_order: "desc" },
    select: { sort_order: true },
  });
  const sort_order = (last?.sort_order ?? -1) + 1;

  const item = await (prisma as any).faqItem.create({
    data: {
      category,
      question,
      answer,
      icon_key,
      sort_order,
      created_by: admin.id,
    },
  });

  await writeAuditLog(admin.id, "created_faq", "FaqItem", item.id, {
    category,
    question,
  }, { ctx: c });

  return c.json(item);
});

// PATCH /api/admin/faqs/:id — edit a single FAQ item
faqsAdminRoutes.patch("/faqs/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (id <= 0) return c.json({ error: "Invalid id" }, 400);

  const body = sanitizeObject(await c.req.json()) as Record<string, unknown>;
  const existing = await (prisma as any).faqItem.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "FAQ not found" }, 404);

  const data: Record<string, unknown> = {};

  if (body.category !== undefined) {
    if (
      typeof body.category !== "string" || body.category.trim().length === 0
    ) {
      return c.json({ error: "Category is required" }, 400);
    }
    if (body.category.length > MAX_CATEGORY_LENGTH) {
      return c.json(
        { error: `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters` },
        400,
      );
    }
    data.category = (body.category as string).trim();
  }
  if (body.question !== undefined) {
    if (
      typeof body.question !== "string" || body.question.trim().length === 0
    ) {
      return c.json({ error: "Question is required" }, 400);
    }
    if (body.question.length > MAX_TEXT_LENGTH) {
      return c.json(
        { error: `Question cannot exceed ${MAX_TEXT_LENGTH} characters` },
        400,
      );
    }
    data.question = (body.question as string).trim();
  }
  if (body.answer !== undefined) {
    if (typeof body.answer !== "string" || body.answer.trim().length === 0) {
      return c.json({ error: "Answer is required" }, 400);
    }
    if (body.answer.length > MAX_TEXT_LENGTH) {
      return c.json(
        { error: `Answer cannot exceed ${MAX_TEXT_LENGTH} characters` },
        400,
      );
    }
    data.answer = (body.answer as string).trim();
  }
  if (body.icon_key !== undefined) {
    if (!isSupportedIcon(body.icon_key)) {
      return c.json({ error: "Unsupported icon" }, 400);
    }
    data.icon_key = body.icon_key;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return c.json({ error: "is_active must be a boolean" }, 400);
    }
    data.is_active = body.is_active;
  }

  const updated = await (prisma as any).faqItem.update({
    where: { id },
    data,
  });

  await writeAuditLog(admin.id, "updated_faq", "FaqItem", id, {
    changes: Object.keys(data),
  }, { ctx: c });

  return c.json(updated);
});

// DELETE /api/admin/faqs/:id — remove a single FAQ item
faqsAdminRoutes.delete("/faqs/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (id <= 0) return c.json({ error: "Invalid id" }, 400);

  const existing = await (prisma as any).faqItem.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "FAQ not found" }, 404);

  await (prisma as any).faqItem.delete({ where: { id } });

  await writeAuditLog(admin.id, "deleted_faq", "FaqItem", id, {
    category: existing.category,
    question: existing.question,
  }, { ctx: c });

  return c.json({ success: true });
});

// POST /api/admin/faqs/reorder — bulk-update sort_order across one or more
// categories. Expects { items: [{ id, category, sort_order }] }.
faqsAdminRoutes.post("/faqs/reorder", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json()) as { items?: unknown };

  if (!Array.isArray(body.items)) {
    return c.json({ error: "items must be an array" }, 400);
  }

  const updates: Array<{ id: number; category: string; sort_order: number }> =
    [];
  for (const raw of body.items as unknown[]) {
    if (typeof raw !== "object" || raw === null) {
      return c.json({ error: "Each item must be an object" }, 400);
    }
    const obj = raw as Record<string, unknown>;
    const id = safeParseInt(obj.id as string | number | null | undefined, 0);
    const sort_order = safeParseInt(
      obj.sort_order as string | number | null | undefined,
      -1,
    );
    const category = typeof obj.category === "string" ? obj.category.trim() : "";
    if (id <= 0 || sort_order < 0 || category.length === 0) {
      return c.json({ error: "Invalid reorder entry" }, 400);
    }
    updates.push({ id, category, sort_order });
  }

  await prisma.$transaction(
    updates.map((u) =>
      (prisma as any).faqItem.update({
        where: { id: u.id },
        data: { category: u.category, sort_order: u.sort_order },
      })
    ),
  );

  await writeAuditLog(admin.id, "reordered_faqs", "FaqItem", 0, {
    count: updates.length,
  }, { ctx: c });

  return c.json({ success: true, count: updates.length });
});

// PATCH /api/admin/faqs/category — rename a category across all items.
// Body: { from: string, to: string }
faqsAdminRoutes.patch("/faqs/category", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json()) as Record<string, unknown>;
  const from = typeof body.from === "string" ? body.from.trim() : "";
  const to = typeof body.to === "string" ? body.to.trim() : "";

  if (!from) return c.json({ error: "from is required" }, 400);
  if (!to) return c.json({ error: "to is required" }, 400);
  if (to.length > MAX_CATEGORY_LENGTH) {
    return c.json(
      { error: `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters` },
      400,
    );
  }
  if (from === to) {
    return c.json({ success: true, updated: 0 });
  }

  const result = await (prisma as any).faqItem.updateMany({
    where: { category: from },
    data: { category: to },
  });

  await writeAuditLog(admin.id, "renamed_faq_category", "FaqItem", 0, {
    from,
    to,
    updated: result.count,
  }, { ctx: c });

  return c.json({ success: true, updated: result.count });
});

// POST /api/admin/faqs/restore-defaults — append any missing default
// questions. Does not touch existing rows. Useful after a deletion mistake
// or when new defaults are shipped with an upgrade.
faqsAdminRoutes.post("/faqs/restore-defaults", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const existing = await (prisma as any).faqItem.findMany({
    select: { category: true, question: true },
  });
  const existingKeys = new Set(
    existing.map((e: { category: string; question: string }) =>
      `${e.category} ${e.question}`
    ),
  );

  const missing = DEFAULT_FAQS.filter(
    (entry) => !existingKeys.has(`${entry.category} ${entry.question}`),
  );

  if (missing.length === 0) {
    return c.json({ success: true, restored: 0 });
  }

  // Append each missing default at the end of its category.
  const categoryTails = new Map<string, number>();
  for (const entry of missing) {
    if (!categoryTails.has(entry.category)) {
      const last = await (prisma as any).faqItem.findFirst({
        where: { category: entry.category },
        orderBy: { sort_order: "desc" },
        select: { sort_order: true },
      });
      categoryTails.set(entry.category, last?.sort_order ?? -1);
    }
  }

  await (prisma as any).faqItem.createMany({
    data: missing.map((entry) => {
      const next = (categoryTails.get(entry.category) ?? -1) + 1;
      categoryTails.set(entry.category, next);
      return {
        category: entry.category,
        icon_key: entry.icon_key,
        question: entry.question,
        answer: entry.answer,
        sort_order: next,
        created_by: admin.id,
      };
    }),
  });

  await writeAuditLog(admin.id, "restored_faq_defaults", "FaqItem", 0, {
    restored: missing.length,
  }, { ctx: c });

  return c.json({ success: true, restored: missing.length });
});

export default faqsAdminRoutes;
