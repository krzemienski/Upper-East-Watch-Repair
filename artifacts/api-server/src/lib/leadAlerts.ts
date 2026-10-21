import { ReplitConnectors } from "@replit/connectors-sdk";
import type { repairLeadsTable } from "@workspace/db";
import { logger } from "./logger";

type RepairLead = typeof repairLeadsTable.$inferSelect;

const intakeLabels: Record<RepairLead["intakeMode"], string> = {
  mail_in: "Mail-in",
  in_store: "In store",
  unsure: "Not sure yet",
};

const channelLabels: Record<RepairLead["preferredChannel"], string> = {
  email: "Email",
  phone: "Phone call",
  sms: "Text message",
  none: "No preference",
};

function headerValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodedSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(headerValue(subject)).toString("base64")}?=`;
}

function alertBody(lead: RepairLead, adminUrl: string): string {
  const watch = [lead.watchBrand, lead.watchModel].filter(Boolean).join(" ");
  const lines = [
    `New service request #${lead.id}`,
    "",
    `Name: ${lead.name}`,
    `Phone: ${lead.phone ?? "—"}`,
    `Email: ${lead.email ?? "—"}`,
    `Preferred contact: ${channelLabels[lead.preferredChannel]}`,
    `Service: ${lead.serviceNeeded ?? "—"}`,
    `Watch: ${watch || "—"}`,
    `Intake: ${intakeLabels[lead.intakeMode]}`,
    `Submitted: ${lead.createdAt.toLocaleString("en-US", { timeZone: "America/New_York" })}`,
    "",
    "Description:",
    lead.description,
    "",
    `Open in admin: ${adminUrl}`,
  ];
  return lines.join("\r\n");
}

/**
 * Emails the shop about a newly submitted service request through the connected Gmail account.
 * Never throws: an alert failure must not affect the customer's submission.
 */
export async function sendNewLeadAlert(lead: RepairLead, siteOrigin: string): Promise<void> {
  const to = process.env["LEAD_ALERT_EMAIL_TO"]?.trim();
  if (!to) {
    logger.warn({ leadId: lead.id }, "LEAD_ALERT_EMAIL_TO is not set; skipping new-lead email");
    return;
  }

  const adminUrl = `${siteOrigin}/admin?lead=${lead.id}`;
  const headers = [
    `To: ${headerValue(to)}`,
    `Subject: ${encodedSubject(`New service request #${lead.id}: ${lead.name}`)}`,
    ...(lead.email ? [`Reply-To: ${headerValue(lead.email)}`] : []),
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  const message = `${headers.join("\r\n")}\r\n\r\n${Buffer.from(alertBody(lead, adminUrl)).toString("base64")}`;

  try {
    const response = await new ReplitConnectors().proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: Buffer.from(message).toString("base64url") }),
      },
    );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      logger.error({ leadId: lead.id, status: response.status, detail }, "New-lead email failed");
      return;
    }
    const sent = (await response.json()) as { id?: string };
    logger.info({ leadId: lead.id, messageId: sent.id }, "New-lead email sent");
  } catch (err) {
    logger.error({ leadId: lead.id, err }, "New-lead email failed");
  }
}
