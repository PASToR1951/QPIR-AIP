import { prisma } from "../db/client.ts";
import { sendDeadlineReminderNotification } from "./accountEmails.ts";
import { logger } from "./logger.ts";
import { pushNotifications } from "./notifStream.ts";

const REMINDER_DAY_OFFSETS = new Set([14, 7, 3, 1, 0]);
const REMINDER_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const TARGET_ROLES = ["School", "Division Personnel"] as const;

let reminderIntervalId: ReturnType<typeof setInterval> | null = null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildQuarterLabel(quarter: number, year: number): string {
  const ordinals: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
  return `${ordinals[quarter]} Quarter CY ${year}`;
}

function buildDefaultDeadline(year: number, quarter: number): Date {
  const defaults: Record<number, Date> = {
    1: new Date(year, 2, 31, 23, 59, 59, 999),
    2: new Date(year, 5, 30, 23, 59, 59, 999),
    3: new Date(year, 8, 30, 23, 59, 59, 999),
    4: new Date(year, 11, 31, 23, 59, 59, 999),
  };
  return defaults[quarter];
}

function buildDeadline(year: number, quarter: number, customDate?: Date | null): Date {
  if (!customDate) return buildDefaultDeadline(year, quarter);
  const deadline = new Date(customDate);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

function reminderTitle(quarterLabel: string, daysUntil: number): string {
  if (daysUntil === 0) return `${quarterLabel} PIR deadline is today`;
  if (daysUntil === 1) return `${quarterLabel} PIR deadline is tomorrow`;
  return `${quarterLabel} PIR deadline in ${daysUntil} days`;
}

function reminderMessage(quarterLabel: string, deadline: Date): string {
  const formatted = deadline.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${quarterLabel} closes on ${formatted}. Submit your PIR - Quarterly Report before the deadline.`;
}

export async function runDeadlineReminderSweep(now = new Date()) {
  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear + 1];
  const today = startOfDay(now);

  const [users, customDeadlines] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: [...TARGET_ROLES] },
        is_active: true,
        deleted_at: null,
      },
      select: { id: true },
    }),
    prisma.deadline.findMany({
      where: { year: { in: years } },
      select: { id: true, year: true, quarter: true, date: true, open_date: true },
    }),
  ]);

  if (users.length === 0) return;

  const existingNotifications = await prisma.notification.findMany({
    where: {
      user_id: { in: users.map((user) => user.id) },
      type: "deadline_reminder",
      created_at: { gte: new Date(currentYear - 1, 0, 1) },
    },
    select: { user_id: true, title: true, message: true },
  });

  const existingKeys = new Set(
    existingNotifications.map((notification) => (
      `${notification.user_id}:${notification.title}:${notification.message}`
    )),
  );

  const notificationsToCreate: Array<{
    user_id: number;
    title: string;
    message: string;
    type: string;
    entity_type: string;
  }> = [];
  const emailRemindersToSend: Array<{
    user_id: number;
    quarterLabel: string;
    deadline: Date;
    daysLeft: number;
  }> = [];

  for (const year of years) {
    for (const quarter of [1, 2, 3, 4]) {
      const customDeadline = customDeadlines.find((entry) => entry.year === year && entry.quarter === quarter);
      const deadline = buildDeadline(year, quarter, customDeadline?.date ?? null);
      const openDate = customDeadline?.open_date
        ? startOfDay(new Date(customDeadline.open_date))
        : new Date(year, (quarter - 1) * 3, 1);
      openDate.setHours(0, 0, 0, 0);

      if (today < openDate) continue;

      const daysUntil = Math.round((startOfDay(deadline).getTime() - today.getTime()) / 86400000);
      if (!REMINDER_DAY_OFFSETS.has(daysUntil)) continue;

      const quarterLabel = buildQuarterLabel(quarter, year);
      const title = reminderTitle(quarterLabel, daysUntil);
      const message = reminderMessage(quarterLabel, deadline);

      for (const user of users) {
        const dedupeKey = `${user.id}:${title}:${message}`;
        if (existingKeys.has(dedupeKey)) continue;
        existingKeys.add(dedupeKey);
        notificationsToCreate.push({
          user_id: user.id,
          title,
          message,
          type: "deadline_reminder",
          entity_type: "deadline",
        });
        emailRemindersToSend.push({
          user_id: user.id,
          quarterLabel,
          deadline,
          daysLeft: daysUntil,
        });
      }
    }
  }

  if (notificationsToCreate.length === 0) return;

  const created = await prisma.notification.createManyAndReturn({
    data: notificationsToCreate,
  });
  pushNotifications(created as Array<{
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: Date;
  }>);

  logger.info("Created deadline reminder notifications", {
    count: created.length,
  });

  for (const [index, reminder] of emailRemindersToSend.entries()) {
    try {
      await sendDeadlineReminderNotification(reminder.user_id, {
        quarterLabel: reminder.quarterLabel,
        deadline: reminder.deadline,
        daysLeft: reminder.daysLeft,
      });
    } catch (error) {
      logger.error("Deadline reminder email failed", {
        user_id: reminder.user_id,
        error,
      });
    }

    if (index < emailRemindersToSend.length - 1) {
      await delay(1000);
    }
  }
}

export function startDeadlineReminderScheduler() {
  if (reminderIntervalId !== null) return;

  const runSafely = async () => {
    try {
      await runDeadlineReminderSweep();
    } catch (error) {
      logger.error("Deadline reminder sweep failed", error);
    }
  };

  void runSafely();
  reminderIntervalId = setInterval(() => {
    void runSafely();
  }, REMINDER_CHECK_INTERVAL_MS);
}
