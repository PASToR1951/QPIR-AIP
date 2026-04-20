import { Hono } from "hono";
import { adminOnly } from "../shared/guards.ts";
import { listActionCatalog } from "./actionCatalog.ts";

export const catalogRoutes = new Hono();

catalogRoutes.use("/logs/catalog", adminOnly);

catalogRoutes.get("/logs/catalog", (c) => {
  c.header("Cache-Control", "private, max-age=300");
  return c.json({ actions: listActionCatalog() });
});
