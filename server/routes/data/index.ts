import { Hono } from "hono";
import draftsRoutes from "./drafts.ts";
import lookupsRoutes from "./lookups.ts";
import aipRoutes from "./aips.ts";
import pirRoutes from "./pirs.ts";
import dashboardRoutes from "./dashboard.ts";
import notificationsRoutes from "./notifications.ts";

const dataRoutes = new Hono();

dataRoutes.route("/", draftsRoutes);
dataRoutes.route("/", lookupsRoutes);
dataRoutes.route("/", aipRoutes);
dataRoutes.route("/", pirRoutes);
dataRoutes.route("/", dashboardRoutes);
dataRoutes.route("/", notificationsRoutes);

export default dataRoutes;
