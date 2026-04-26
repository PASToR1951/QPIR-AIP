import { Hono } from "hono";
import {
  adminOnly,
  adminOrObserverOnly,
} from "./shared/guards.ts";
import { listRouter } from "./submissions/list.ts";
import { detailRouter } from "./submissions/detail.ts";
import { statusRouter } from "./submissions/status.ts";
import { aipEditRouter } from "./submissions/aipEdit.ts";
import { pirActionsRouter } from "./submissions/pirActions.ts";

export const observerRoutes = new Hono();
export const adminRoutes = new Hono();

// ── Auth guards ────────────────────────────────────────────────────────────

observerRoutes.use("/submissions", adminOrObserverOnly);
observerRoutes.use("/submissions/export", adminOrObserverOnly);
observerRoutes.use("/submissions/:id", adminOrObserverOnly);

adminRoutes.use("/submissions/:id/status", adminOnly);
adminRoutes.use("/aips/:id/approve-edit", adminOnly);
adminRoutes.use("/aips/:id/deny-edit", adminOnly);
adminRoutes.use("/pirs/:id/presented", adminOnly);

// ── Route handler mounts ───────────────────────────────────────────────────

observerRoutes.route("/", listRouter);
observerRoutes.route("/", detailRouter);

adminRoutes.route("/", statusRouter);
adminRoutes.route("/", aipEditRouter);
adminRoutes.route("/", pirActionsRouter);
