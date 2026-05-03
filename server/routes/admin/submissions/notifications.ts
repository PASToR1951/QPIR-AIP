import { prisma } from "../../../db/client.ts";
import { pushNotification } from "../../../lib/notifStream.ts";

// ── Status label map (shared by PIR + AIP status handlers) ─────────────────

export const STATUS_LABELS: Record<string, string> = {
  "Approved": "approved",
  "Returned": "returned",
  "Under Review": "under_review",
  "For Recommendation": "for_recommendation",
  "For CES Review": "for_ces_review",
  "Submitted": "submitted",
};

// ── PIR status notifications ───────────────────────────────────────────────

const PIR_STATUS_MESSAGES: Record<
  string,
  (programTitle: string, quarter: string, school: string, feedback: string) => {
    title: string;
    message: string;
  }
> = {
  "Approved": (programTitle, quarter, school, feedback) => ({
    title: "PIR Approved",
    message:
      `Your PIR for ${programTitle} (${quarter}) from ${school} has been approved.${feedback ? ` Feedback: ${feedback}` : ""}`,
  }),
  "Returned": (programTitle, quarter, _school, feedback) => ({
    title: "PIR Returned",
    message:
      `Your PIR for ${programTitle} (${quarter}) has been returned for correction.${feedback ? ` Feedback: ${feedback}` : ""}`,
  }),
  "Under Review": (programTitle, quarter) => ({
    title: "PIR Under Review",
    message: `Your PIR for ${programTitle} (${quarter}) is now under review.`,
  }),
  "For Recommendation": (programTitle, quarter) => ({
    title: "PIR Pending Recommendation",
    message:
      `Your PIR for ${programTitle} (${quarter}) has been sent for focal person recommendation.`,
  }),
  "For CES Review": (programTitle, quarter) => ({
    title: "PIR Pending CES Review",
    message:
      `Your PIR for ${programTitle} (${quarter}) has been sent for CES review.`,
  }),
  "Submitted": (programTitle, quarter) => ({
    title: "PIR Status Updated",
    message:
      `Your PIR for ${programTitle} (${quarter}) status has been updated to Submitted.`,
  }),
};

export async function pushPIRStatusNotification(
  pir: {
    id: number;
    quarter: string;
    created_by_user_id: number | null;
    aip: { program: { title: string }; school?: { name: string } | null };
  },
  status: string,
  feedback: string,
) {
  if (!pir.created_by_user_id) return;
  const builder = PIR_STATUS_MESSAGES[status];
  if (!builder) return;

  const school = pir.aip.school?.name ?? "your school";
  const notif = builder(pir.aip.program.title, pir.quarter, school, feedback);

  const created = await prisma.notification.create({
    data: {
      user_id: pir.created_by_user_id,
      title: notif.title,
      message: notif.message,
      type: STATUS_LABELS[status],
      entity_id: pir.id,
      entity_type: "pir",
    },
  });
  pushNotification(created);
}

// ── AIP status notifications ───────────────────────────────────────────────

export async function pushAIPStatusNotification(
  aip: {
    id: number;
    year: number;
    created_by_user_id: number | null;
    program: { title: string };
    school?: { name: string } | null;
  },
  status: string,
  feedback: string,
) {
  if (!aip.created_by_user_id) return;

  const school = aip.school?.name ?? "your school";
  const messages: Record<string, { title: string; message: string }> = {
    "Approved": {
      title: "AIP Approved",
      message:
        `Your AIP for ${aip.program.title} (FY ${aip.year}) from ${school} has been approved.`,
    },
    "Returned": {
      title: "AIP Returned",
      message:
        `Your AIP for ${aip.program.title} (FY ${aip.year}) has been returned for correction.${feedback ? ` Feedback: ${feedback}` : ""}`,
    },
  };

  const notif = messages[status];
  if (!notif) return;

  const created = await prisma.notification.create({
    data: {
      user_id: aip.created_by_user_id,
      title: notif.title,
      message: notif.message,
      type: STATUS_LABELS[status],
      entity_id: aip.id,
      entity_type: "aip",
    },
  });
  pushNotification(created);
}

// ── AIP edit-request notifications ────────────────────────────────────────

export async function pushAIPEditApprovedNotification(aip: {
  id: number;
  year: number;
  created_by_user_id: number | null;
  program: { title: string };
}) {
  if (!aip.created_by_user_id) return;
  const created = await prisma.notification.create({
    data: {
      user_id: aip.created_by_user_id,
      title: "Edit Request Approved",
      message:
        `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been approved. You may now edit and resubmit.`,
      type: "aip_edit_approved",
      entity_id: aip.id,
      entity_type: "aip",
    },
  });
  pushNotification(created);
}

export async function pushAIPEditDeniedNotification(aip: {
  id: number;
  year: number;
  created_by_user_id: number | null;
  program: { title: string };
}) {
  if (!aip.created_by_user_id) return;
  const created = await prisma.notification.create({
    data: {
      user_id: aip.created_by_user_id,
      title: "Edit Request Denied",
      message:
        `Your request to edit the AIP for ${aip.program.title} (FY ${aip.year}) has been denied.`,
      type: "aip_edit_denied",
      entity_id: aip.id,
      entity_type: "aip",
    },
  });
  pushNotification(created);
}
