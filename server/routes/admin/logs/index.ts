import { Hono } from "hono";
import { listRoutes } from "./list.ts";
import { facetsRoutes } from "./facets.ts";
import { detailRoutes } from "./detail.ts";
import { catalogRoutes } from "./catalog.ts";
import { exportRoutes } from "./export.ts";

const logsRoutes = new Hono();

logsRoutes.route("/", catalogRoutes);
logsRoutes.route("/", facetsRoutes);
logsRoutes.route("/", exportRoutes);
logsRoutes.route("/", detailRoutes);
logsRoutes.route("/", listRoutes);

export default logsRoutes;
