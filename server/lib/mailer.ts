import nodemailer from "nodemailer";
import { decryptText } from "./emailCrypto.ts";
import { getOrCreateEmailConfig, isEmailConfigured } from "./emailConfig.ts";
import { logger } from "./logger.ts";

type MailJob = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type MailSendResult = {
  status: "sent" | "skipped" | "failed";
  error?: string;
};

type TransportState = {
  signature: string;
  transport: {
    sendMail(options: Record<string, unknown>): Promise<unknown>;
  };
};

let cachedState: TransportState | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown email error";
}

async function getTransport(options?: { ignoreDisabled?: boolean }) {
  const config = await getOrCreateEmailConfig();
  if (!isEmailConfigured(config, options)) return null;

  const smtpPass = await decryptText(config.smtp_pass_enc);
  const signature = JSON.stringify({
    host: config.smtp_host,
    port: config.smtp_port,
    user: config.smtp_user,
    pass: smtpPass,
  });

  if (!cachedState || cachedState.signature !== signature) {
    cachedState = {
      signature,
      transport: nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.smtp_user,
          pass: smtpPass,
        },
      }),
    };
  }

  return {
    config,
    transport: cachedState.transport,
  };
}

export async function sendMail(
  job: MailJob,
  options?: { ignoreDisabled?: boolean },
): Promise<MailSendResult> {
  try {
    const state = await getTransport(options);
    if (!state) {
      logger.warn("Email skipped because SMTP is disabled or incomplete", {
        to: job.to,
        subject: job.subject,
      });
      return {
        status: "skipped",
        error: "Email delivery is disabled or not configured.",
      };
    }

    await state.transport.sendMail({
      from: `"${state.config.from_name}" <${state.config.smtp_user}>`,
      to: job.to,
      subject: job.subject,
      html: job.html,
      ...(job.text ? { text: job.text } : {}),
    });

    return { status: "sent" };
  } catch (error) {
    const message = getErrorMessage(error);
    logger.error("Email send failed", {
      to: job.to,
      subject: job.subject,
      error: message,
    });
    return { status: "failed", error: message };
  }
}

export async function sendMailThrottled(
  jobs: MailJob[],
  options?: {
    delayMs?: number;
    ignoreDisabled?: boolean;
    onProgress?: (result: MailSendResult, job: MailJob, index: number) => void | Promise<void>;
  },
) {
  const delayMs = options?.delayMs ?? 1000;
  const results: MailSendResult[] = [];

  for (const [index, job] of jobs.entries()) {
    const result = await sendMail(job, {
      ignoreDisabled: options?.ignoreDisabled,
    });
    results.push(result);
    if (options?.onProgress) {
      await options.onProgress(result, job, index);
    }
    if (index < jobs.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}
