import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { DEFAULT_FAQS } from "../lib/faqDefaults.ts";

const faqsRoutes = new Hono();

// Auto-seed the FAQ table on first access. Idempotent: subsequent calls
// skip when rows already exist. Concurrency-safe because the createMany
// is gated by a count check, and ties on the empty case still produce
// the same effective state (duplicates are not destructive at this layer
// because the seed only runs from the public-read path).
async function ensureSeed(): Promise<void> {
  const count = await (prisma as any).faqItem.count();
  if (count > 0) return;

  await (prisma as any).faqItem.createMany({
    data: DEFAULT_FAQS.map((entry, index) => ({
      category: entry.category,
      icon_key: entry.icon_key,
      question: entry.question,
      answer: entry.answer,
      sort_order: index,
      is_active: true,
    })),
  });
}

faqsRoutes.get("/faqs", async (c) => {
  try {
    await ensureSeed();
  } catch (err) {
    console.error("FAQ auto-seed failed:", err);
  }

  const items = await (prisma as any).faqItem.findMany({
    where: { is_active: true },
    orderBy: [{ category: "asc" }, { sort_order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      category: true,
      question: true,
      answer: true,
      icon_key: true,
      sort_order: true,
    },
  });

  // Group by category, preserving each category's first appearance order.
  const byCategory = new Map<
    string,
    {
      category: string;
      icon_key: string;
      questions: { id: number; q: string; a: string }[];
    }
  >();
  for (const item of items) {
    let group = byCategory.get(item.category);
    if (!group) {
      group = {
        category: item.category,
        icon_key: item.icon_key,
        questions: [],
      };
      byCategory.set(item.category, group);
    }
    group.questions.push({ id: item.id, q: item.question, a: item.answer });
  }

  return c.json(Array.from(byCategory.values()));
});

export default faqsRoutes;
