import { Hono } from "hono";
import {
  adminOnly,
  adminAnalyticsOnly,
} from "./shared/guards.ts";
import { listRouter } from "./submissions/list.ts";
import { detailRouter } from "./submissions/detail.ts";
import { statusRouter } from "./submissions/status.ts";
import { aipEditRouter } from "./submissions/aipEdit.ts";
import { pirActionsRouter } from "./submissions/pirActions.ts";

export const readRoutes = new Hono();
export const adminRoutes = new Hono();

// ── Auth guards ────────────────────────────────────────────────────────────

readRoutes.use("/submissions", adminAnalyticsOnly);
readRoutes.use("/submissions/export", adminAnalyticsOnly);
readRoutes.use("/submissions/:id", adminAnalyticsOnly);

adminRoutes.use("/submissions/:id/status", adminOnly);
adminRoutes.use("/aips/:id/approve-edit", adminOnly);
adminRoutes.use("/aips/:id/deny-edit", adminOnly);
adminRoutes.use("/pirs/:id/approve-edit", adminOnly);
adminRoutes.use("/pirs/:id/deny-edit", adminOnly);
adminRoutes.use("/pirs/:id/presented", adminOnly);

// ── Route handler mounts ───────────────────────────────────────────────────

readRoutes.route("/", listRouter);
readRoutes.route("/", detailRouter);

adminRoutes.route("/", statusRouter);
adminRoutes.route("/", aipEditRouter);
adminRoutes.route("/", pirActionsRouter);
