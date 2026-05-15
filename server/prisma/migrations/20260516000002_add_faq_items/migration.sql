CREATE TABLE IF NOT EXISTS "faq_items" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL DEFAULT 'HelpCircle',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "faq_items_category_sort_order_idx"
  ON "faq_items" ("category", "sort_order");

CREATE INDEX IF NOT EXISTS "faq_items_is_active_category_sort_order_idx"
  ON "faq_items" ("is_active", "category", "sort_order");
