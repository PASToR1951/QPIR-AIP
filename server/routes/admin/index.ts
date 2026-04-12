import { Hono } from "hono";
import pirReviewRoutes from "./pirReview.ts";
import overviewRoutes from "./overview.ts";
import {
  observerRoutes as submissionObserverRoutes,
  adminRoutes as submissionAdminRoutes,
} from "./submissions.ts";
import usersRoutes from "./users.ts";
import {
  observerRoutes as schoolsObserverRoutes,
  adminRoutes as schoolsAdminRoutes,
} from "./schoolsClusters.ts";
import {
  observerRoutes as programObserverRoutes,
  adminRoutes as programAdminRoutes,
} from "./programs.ts";
import deadlinesRoutes from "./deadlines.ts";
import reportsRoutes from "./reports.ts";
import announcementsRoutes from "./announcements.ts";
import settingsRoutes from "./settings.ts";
import auditRoutes from "./audit.ts";
import emailRoutes from "./emailBlast.ts";

const adminRoutes = new Hono();

adminRoutes.route("/", pirReviewRoutes);

adminRoutes.route("/", overviewRoutes);
adminRoutes.route("/", submissionObserverRoutes);
adminRoutes.route("/", schoolsObserverRoutes);
adminRoutes.route("/", programObserverRoutes);

adminRoutes.route("/", submissionAdminRoutes);
adminRoutes.route("/", usersRoutes);
adminRoutes.route("/", schoolsAdminRoutes);
adminRoutes.route("/", programAdminRoutes);
adminRoutes.route("/", deadlinesRoutes);
adminRoutes.route("/", reportsRoutes);
adminRoutes.route("/", announcementsRoutes);
adminRoutes.route("/", settingsRoutes);
adminRoutes.route("/", emailRoutes);
adminRoutes.route("/", auditRoutes);

export default adminRoutes;
