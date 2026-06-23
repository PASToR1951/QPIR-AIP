import { Hono } from "hono";
import pirReviewRoutes from "./pirReview.ts";
import focalReviewRoutes from "./focalPersonReview.ts";
import overviewRoutes from "./overview.ts";
import {
  readRoutes as submissionReadRoutes,
  adminRoutes as submissionAdminRoutes,
} from "./submissions.ts";
import usersRoutes from "./users.ts";
import {
  readRoutes as schoolsReadRoutes,
  adminRoutes as schoolsAdminRoutes,
} from "./schoolsClusters.ts";
import {
  readRoutes as programReadRoutes,
  adminRoutes as programAdminRoutes,
} from "./programs.ts";
import deadlinesRoutes from "./deadlines.ts";
import reportsRoutes from "./reports.ts";
import consolidationNotesRoutes from "./consolidationNotes.ts";
import announcementsRoutes from "./announcements.ts";
import settingsRoutes from "./settings.ts";
import auditRoutes from "./audit.ts";
import emailRoutes from "./emailBlast.ts";
import emailTemplatesRoutes from "./emailTemplates.ts";
import sessionsRoutes from "./sessions.ts";
import logsRoutes from "./logs/index.ts";
import faqsAdminRoutes from "./faqs.ts";

const adminRoutes = new Hono();

adminRoutes.route("/", pirReviewRoutes);
adminRoutes.route("/", focalReviewRoutes);

adminRoutes.route("/", overviewRoutes);
adminRoutes.route("/", submissionReadRoutes);
adminRoutes.route("/", schoolsReadRoutes);
adminRoutes.route("/", programReadRoutes);

adminRoutes.route("/", submissionAdminRoutes);
adminRoutes.route("/", usersRoutes);
adminRoutes.route("/", schoolsAdminRoutes);
adminRoutes.route("/", programAdminRoutes);
adminRoutes.route("/", sessionsRoutes);
adminRoutes.route("/", deadlinesRoutes);
adminRoutes.route("/", reportsRoutes);
adminRoutes.route("/", consolidationNotesRoutes);
adminRoutes.route("/", announcementsRoutes);
adminRoutes.route("/", settingsRoutes);
adminRoutes.route("/", emailRoutes);
adminRoutes.route("/", emailTemplatesRoutes);
adminRoutes.route("/", auditRoutes);
adminRoutes.route("/", logsRoutes);
adminRoutes.route("/", faqsAdminRoutes);

export default adminRoutes;
