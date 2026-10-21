import {
  AddRepairLeadNoteBody,
  AddRepairLeadNoteParams,
  AddRepairLeadNoteResponse,
  CreateFunnelEventBody,
  CreateFunnelEventResponse,
  CreateRepairLeadBody,
  CreateRepairLeadResponse,
  DownloadRepairLeadAttachmentParams,
  FinalizeLeadAttachmentBody,
  FinalizeLeadAttachmentParams,
  FinalizeLeadAttachmentResponse,
  GetRepairLeadParams,
  GetRepairLeadReportResponse,
  GetRepairLeadResponse,
  ListFollowUpsQueryParams,
  ListFollowUpsResponse,
  ListRepairLeadsQueryParams,
  ListRepairLeadsResponse,
  RequestLeadUploadUrlBody,
  RequestLeadUploadUrlParams,
  RequestLeadUploadUrlResponse,
  UpdateFollowUpBody,
  UpdateFollowUpParams,
  UpdateFollowUpResponse,
  UpdateRepairLeadBody,
  UpdateRepairLeadParams,
  UpdateRepairLeadResponse,
} from "@workspace/api-zod";
import {
  db,
  followUpTasksTable,
  funnelEventsTable,
  leadAttachmentsTable,
  leadEventsTable,
  repairLeadsTable,
} from "@workspace/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import express, { Router, type IRouter, type Request, type Response } from "express";
import { ADMIN_ACTOR_ID, isAdminRequest } from "../lib/adminAuth";
import {
  createLeadObjectPath,
  deletePrivateObject,
  getPrivateObject,
  inspectPrivateObject,
  pipePrivateObject,
  writePrivateObject,
} from "../lib/objectStorage";
import { sendNewLeadAlert } from "../lib/leadAlerts";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES = 5;
const MAX_SIZE = 8 * 1024 * 1024;
const RESERVATION_TTL_MS = 15 * 60_000;

async function cleanupExpiredReservations(leadId?: number): Promise<void> {
  const conditions = [
    isNull(leadAttachmentsTable.finalizedAt),
    lte(leadAttachmentsTable.expiresAt, new Date()),
  ];
  if (leadId) conditions.push(eq(leadAttachmentsTable.leadId, leadId));
  const expired = await db
    .select({
      id: leadAttachmentsTable.id,
      leadId: leadAttachmentsTable.leadId,
      objectPath: leadAttachmentsTable.objectPath,
    })
    .from(leadAttachmentsTable)
    .where(and(...conditions));
  for (const item of expired) {
    await deletePrivateObject(item.objectPath, item.leadId);
    await db
      .delete(leadAttachmentsTable)
      .where(
        and(
          eq(leadAttachmentsTable.id, item.id),
          isNull(leadAttachmentsTable.finalizedAt),
          lte(leadAttachmentsTable.expiresAt, new Date()),
        ),
      );
  }
}
const cleanupTimer = setInterval(() => {
  void cleanupExpiredReservations().catch((error: unknown) =>
    logger.warn({ err: error }, "Unable to clean expired lead upload reservations"),
  );
}, RESERVATION_TTL_MS);
cleanupTimer.unref();

function requireAdmin(_req: Request, res: Response): boolean {
  return isAdminRequest(res);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function validUploadToken(leadId: number, token: unknown) {
  if (typeof token !== "string" || token.length < 32) return false;
  const [lead] = await db
    .select({
      hash: repairLeadsTable.uploadTokenHash,
      expiresAt: repairLeadsTable.uploadTokenExpiresAt,
    })
    .from(repairLeadsTable)
    .where(eq(repairLeadsTable.id, leadId))
    .limit(1);
  if (!lead || lead.expiresAt <= new Date()) return false;
  const supplied = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(lead.hash, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function headerToken(req: Request): string | undefined {
  const value = req.header("X-Lead-Upload-Token");
  return value || undefined;
}

function omitNulls<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== null),
  ) as T;
}

router.post("/funnel-events", async (req, res): Promise<void> => {
  const body = CreateFunnelEventBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid funnel event" });
    return;
  }
  try {
    const [event] = await db.insert(funnelEventsTable).values(body.data).returning();
    res.status(201).json(CreateFunnelEventResponse.parse(omitNulls(event)));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      res.status(400).json({ error: "Referenced lead does not exist" });
      return;
    }
    throw error;
  }
});

router.post("/leads", async (req, res): Promise<void> => {
  const body = CreateRepairLeadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid lead submission" });
    return;
  }
  const input = body.data;
  const channelAllowed =
    input.preferredChannel === "none" ||
    (input.preferredChannel === "email" && !!input.email && input.emailConsent) ||
    (input.preferredChannel === "phone" && !!input.phone && input.phoneConsent) ||
    (input.preferredChannel === "sms" && !!input.phone && input.smsConsent);
  if (!channelAllowed) {
    res.status(400).json({
      error: "Preferred follow-up channel requires contact details and consent",
    });
    return;
  }

  const uploadToken = randomBytes(32).toString("base64url");
  const uploadTokenExpiresAt = new Date(Date.now() + 60 * 60_000);
  const lead = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(repairLeadsTable)
      .values({
        ...input,
        email: input.email ?? null,
        phone: input.phone ?? null,
        status: "new",
        uploadTokenHash: hashToken(uploadToken),
        uploadTokenExpiresAt,
      })
      .returning();
    await tx.insert(leadEventsTable).values({
      leadId: created.id,
      type: "submitted",
      toStatus: "new",
    });
    if (input.preferredChannel !== "none") {
      await tx.insert(followUpTasksTable).values({
        leadId: created.id,
        channel: input.preferredChannel,
        dueAt: new Date(created.createdAt.getTime() + 24 * 60 * 60_000),
      });
    }
    return created;
  });
  res.status(201).json(
    CreateRepairLeadResponse.parse({
      lead: omitNulls(lead),
      uploadToken,
      uploadTokenExpiresAt,
    }),
  );
  void sendNewLeadAlert(lead, `${req.protocol}://${req.host}`);
});

router.post("/leads/:id/uploads/request-url", async (req, res): Promise<void> => {
  const params = RequestLeadUploadUrlParams.safeParse(req.params);
  const body = RequestLeadUploadUrlBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid upload request" });
    return;
  }
  if (!(await validUploadToken(params.data.id, headerToken(req)))) {
    res.status(401).json({ error: "Invalid or expired upload token" });
    return;
  }
  const now = new Date();
  try {
    await cleanupExpiredReservations(params.data.id);
    const result = await db.transaction(async (tx) => {
      await tx.select({ id: repairLeadsTable.id }).from(repairLeadsTable).where(eq(repairLeadsTable.id, params.data.id)).for("update");
      const [existing] = await tx.select().from(leadAttachmentsTable).where(and(eq(leadAttachmentsTable.leadId, params.data.id), eq(leadAttachmentsTable.clientUploadId, body.data.clientUploadId))).limit(1);
      if (existing) {
        if (existing.originalName !== body.data.name || existing.contentType !== body.data.contentType || existing.size !== body.data.size) throw new Error("RESERVATION_METADATA_MISMATCH");
        return existing;
      }
      const [{ value }] = await tx.select({ value: count() }).from(leadAttachmentsTable).where(and(eq(leadAttachmentsTable.leadId, params.data.id), or(gte(leadAttachmentsTable.expiresAt, now), isNotNull(leadAttachmentsTable.finalizedAt))));
      if (value >= MAX_IMAGES) throw new Error("IMAGE_LIMIT");
      const [attachment] = await tx.insert(leadAttachmentsTable).values({
        leadId: params.data.id, clientUploadId: body.data.clientUploadId,
        objectPath: createLeadObjectPath(params.data.id, randomUUID()),
        originalName: body.data.name, contentType: body.data.contentType, size: body.data.size,
        expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
      }).returning();
      return attachment;
    });
    res.json(RequestLeadUploadUrlResponse.parse({
      uploadURL: `/api/leads/${params.data.id}/uploads/${result.id}`,
      objectPath: result.objectPath,
      attachmentId: result.id,
    }));
  } catch (error) {
    if (error instanceof Error && error.message === "IMAGE_LIMIT") {
      res.status(400).json({ error: "A lead may have at most 5 images" });
      return;
    }
    if (error instanceof Error && error.message === "RESERVATION_METADATA_MISMATCH") {
      res.status(400).json({ error: "clientUploadId metadata does not match its reservation" });
      return;
    }
    throw error;
  }
});

router.put("/leads/:id/uploads/:attachmentId",
  express.raw({ limit: MAX_SIZE, type: (req) => imageTypes.has(String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase()) }),
  async (req, res): Promise<void> => {
    const leadId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    if (!Number.isSafeInteger(leadId) || leadId <= 0 || !Number.isSafeInteger(attachmentId) || attachmentId <= 0) {
      res.status(400).json({ error: "Invalid upload target" }); return;
    }
    if (!(await validUploadToken(leadId, headerToken(req)))) {
      res.status(401).json({ error: "Invalid or expired upload token" }); return;
    }
    const contentType = req.header("Content-Type");
    const contentLength = req.header("Content-Length");
    const bytes = req.body;
    if (!contentType || !imageTypes.has(contentType) || !contentLength || !/^[1-9][0-9]*$/.test(contentLength) || !Buffer.isBuffer(bytes) || bytes.length !== Number(contentLength)) {
      res.status(400).json({ error: "Content-Type and Content-Length must exactly match image bytes" }); return;
    }
    const reservation = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(leadAttachmentsTable).where(and(eq(leadAttachmentsTable.id, attachmentId), eq(leadAttachmentsTable.leadId, leadId))).for("update").limit(1);
      if (!row || (!row.uploadedAt && row.expiresAt <= new Date()) || row.contentType !== contentType || row.size !== bytes.length) return null;
      return row;
    });
    if (!reservation) { res.status(400).json({ error: "Upload reservation is invalid, expired, or does not match" }); return; }
    try {
      const object = await inspectPrivateObject(reservation.objectPath, leadId).catch(() => null);
      if (object && (object.contentType !== contentType || object.size !== bytes.length)) throw new Error("metadata");
      if (object) {
        await db.update(leadAttachmentsTable).set({ uploadedAt: new Date() }).where(eq(leadAttachmentsTable.id, attachmentId));
        res.status(204).end();
        return;
      }
      const [claimed] = await db.update(leadAttachmentsTable)
        .set({ uploadedAt: new Date() })
        .where(and(eq(leadAttachmentsTable.id, attachmentId), isNull(leadAttachmentsTable.uploadedAt)))
        .returning({ id: leadAttachmentsTable.id });
      if (!claimed) {
        const stored = await inspectPrivateObject(reservation.objectPath, leadId).catch(() => null);
        if (!stored || stored.contentType !== contentType || stored.size !== bytes.length) throw new Error("already claimed");
        res.status(204).end();
        return;
      }
      await writePrivateObject(reservation.objectPath, leadId, bytes, contentType);
      res.status(204).end();
    } catch {
      const stored = await inspectPrivateObject(reservation.objectPath, leadId).catch(() => null);
      if (stored?.contentType === contentType && stored.size === bytes.length) {
        await db.update(leadAttachmentsTable).set({ uploadedAt: new Date() }).where(eq(leadAttachmentsTable.id, attachmentId));
        res.status(204).end();
        return;
      }
      await deletePrivateObject(reservation.objectPath, leadId);
      await db.delete(leadAttachmentsTable).where(and(eq(leadAttachmentsTable.id, attachmentId), isNull(leadAttachmentsTable.finalizedAt)));
      res.status(400).json({ error: "Upload could not be stored with the reserved metadata" });
    }
  },
);

router.post("/leads/:id/attachments", async (req, res): Promise<void> => {
  const params = FinalizeLeadAttachmentParams.safeParse(req.params);
  const body = FinalizeLeadAttachmentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid attachment" });
    return;
  }
  if (!(await validUploadToken(params.data.id, headerToken(req)))) {
    res.status(401).json({ error: "Invalid or expired upload token" });
    return;
  }
  const [reservation] = await db
    .select()
    .from(leadAttachmentsTable)
    .where(
      and(
        eq(leadAttachmentsTable.leadId, params.data.id),
        eq(leadAttachmentsTable.objectPath, body.data.objectPath),
      ),
    )
    .limit(1);
  if (
    !reservation ||
    reservation.clientUploadId !== body.data.clientUploadId ||
    reservation.originalName !== body.data.name ||
    reservation.contentType !== body.data.contentType ||
    reservation.size !== body.data.size
  ) {
    if (!reservation || !reservation.finalizedAt) {
      await deletePrivateObject(body.data.objectPath, params.data.id);
      if (reservation) {
        await db.delete(leadAttachmentsTable).where(
          and(eq(leadAttachmentsTable.id, reservation.id), isNull(leadAttachmentsTable.finalizedAt)),
        );
      }
    }
    res.status(400).json({ error: "Attachment does not match an upload reservation" });
    return;
  }
  if (reservation.finalizedAt) {
    res.json(FinalizeLeadAttachmentResponse.parse(reservation));
    return;
  }
  let actual: { contentType: string; size: number };
  try {
    actual = await inspectPrivateObject(body.data.objectPath, params.data.id);
  } catch {
    await db.delete(leadAttachmentsTable).where(
      and(eq(leadAttachmentsTable.id, reservation.id), isNull(leadAttachmentsTable.finalizedAt)),
    );
    res.status(400).json({ error: "Uploaded object was not found" });
    return;
  }
  if (
    !reservation.uploadedAt ||
    reservation.expiresAt <= new Date() ||
    !imageTypes.has(actual.contentType) ||
    actual.size <= 0 ||
    actual.size > MAX_SIZE ||
    actual.contentType !== body.data.contentType ||
    actual.size !== body.data.size
  ) {
    await deletePrivateObject(reservation.objectPath, params.data.id);
    await db.delete(leadAttachmentsTable).where(
      and(eq(leadAttachmentsTable.id, reservation.id), isNull(leadAttachmentsTable.finalizedAt)),
    );
    res.status(400).json({ error: "Uploaded image metadata does not match" });
    return;
  }
  try {
    const attachment = await db.transaction(async (tx) => {
      await tx
        .select({ id: repairLeadsTable.id })
        .from(repairLeadsTable)
        .where(eq(repairLeadsTable.id, params.data.id))
        .for("update");
      const [created] = await tx
        .update(leadAttachmentsTable)
        .set({ finalizedAt: new Date() })
        .where(
          and(
            eq(leadAttachmentsTable.id, reservation.id),
            eq(leadAttachmentsTable.leadId, params.data.id),
            isNull(leadAttachmentsTable.finalizedAt),
          ),
        )
        .returning();
      if (created) return created;
      const [finalized] = await tx
        .select()
        .from(leadAttachmentsTable)
        .where(eq(leadAttachmentsTable.id, reservation.id))
        .limit(1);
      return finalized;
    });
    res.status(201).json(FinalizeLeadAttachmentResponse.parse(attachment));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(400).json({ error: "Attachment already finalized" });
      return;
    }
    throw error;
  }
});

router.get("/admin/leads/report", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const [
    statusRows,
    sourceRows,
    campaignRows,
    variantRows,
    serviceRows,
    [funnelMetrics],
    [leadMetrics],
  ] = await Promise.all([
    db
      .select({ key: repairLeadsTable.status, value: count() })
      .from(repairLeadsTable)
      .groupBy(repairLeadsTable.status),
    db
      .select({
        key: sql<string>`coalesce(nullif(${repairLeadsTable.source}, ''), 'unknown')`,
        value: count(),
      })
      .from(repairLeadsTable)
      .groupBy(repairLeadsTable.source),
    db
      .select({
        key: sql<string>`coalesce(nullif(${repairLeadsTable.utmCampaign}, ''), 'unknown')`,
        value: count(),
      })
      .from(repairLeadsTable)
      .groupBy(repairLeadsTable.utmCampaign),
    db
      .select({
        key: sql<string>`coalesce(nullif(${repairLeadsTable.variant}, ''), 'unknown')`,
        value: count(),
      })
      .from(repairLeadsTable)
      .groupBy(repairLeadsTable.variant),
    db
      .select({
        key: sql<string>`coalesce(nullif(${repairLeadsTable.serviceNeeded}, ''), 'unknown')`,
        value: count(),
      })
      .from(repairLeadsTable)
      .groupBy(repairLeadsTable.serviceNeeded),
    db
      .select({
        callClicks: sql<number>`count(*) filter (
          where lower(${funnelEventsTable.event}) in (
            'call_click', 'phone_click', 'request_call_click', 'request-call_click'
          )
          or (
            lower(${funnelEventsTable.event}) = 'cta_clicked'
            and lower(coalesce(${funnelEventsTable.selectedCta}, '')) in (
              'call', 'call_now', 'phone', 'request_call', 'request-call',
              'call_request'
            )
          )
        )::int`,
        directionsClicks: sql<number>`count(*) filter (
          where lower(${funnelEventsTable.event}) in (
            'directions_click', 'direction_click', 'get_directions_click'
          )
          or (
            lower(${funnelEventsTable.event}) = 'cta_clicked'
            and lower(coalesce(${funnelEventsTable.selectedCta}, '')) in (
              'directions', 'directions_footer', 'get_directions', 'get-directions'
            )
          )
        )::int`,
      })
      .from(funnelEventsTable),
    db
      .select({
        intakeSubmissions: sql<number>`count(*)::int`,
        watchesReceived: sql<number>`count(*) filter (
          where ${repairLeadsTable.status} in ('watch_received', 'estimate_pending', 'won')
          or exists (
            select 1 from ${leadEventsTable}
            where ${leadEventsTable.leadId} = ${repairLeadsTable.id}
              and ${leadEventsTable.toStatus} = 'watch_received'
          )
        )::int`,
        wonRepairs:
          sql<number>`count(*) filter (where ${repairLeadsTable.status} = 'won')::int`,
      })
      .from(repairLeadsTable),
  ]);
  const byStatus = Object.fromEntries(statusRows.map((row) => [row.key, row.value]));
  const bySource = Object.fromEntries(sourceRows.map((row) => [row.key, row.value]));
  const byCampaign = Object.fromEntries(
    campaignRows.map((row) => [row.key, row.value]),
  );
  const byVariant = Object.fromEntries(
    variantRows.map((row) => [row.key, row.value]),
  );
  const byServiceNeeded = Object.fromEntries(
    serviceRows.map((row) => [row.key, row.value]),
  );
  const metrics = {
    callClicks: funnelMetrics?.callClicks ?? 0,
    directionsClicks: funnelMetrics?.directionsClicks ?? 0,
    ctaClicks:
      (funnelMetrics?.callClicks ?? 0) + (funnelMetrics?.directionsClicks ?? 0),
    intakeSubmissions: leadMetrics?.intakeSubmissions ?? 0,
    watchesReceived: leadMetrics?.watchesReceived ?? 0,
    wonRepairs: leadMetrics?.wonRepairs ?? 0,
  };
  const percent = (numerator: number, denominator: number) =>
    denominator ? (numerator / denominator) * 100 : 0;
  const stageConversionPercentages = {
    intakeToWatchReceived: percent(
      metrics.watchesReceived,
      metrics.intakeSubmissions,
    ),
    watchReceivedToWon: percent(metrics.wonRepairs, metrics.watchesReceived),
    intakeToWon: percent(metrics.wonRepairs, metrics.intakeSubmissions),
  };
  const total = metrics.intakeSubmissions;
  const conversionRate = stageConversionPercentages.intakeToWon;
  res.json(
    GetRepairLeadReportResponse.parse({
      total,
      byStatus,
      bySource,
      byCampaign,
      byVariant,
      byServiceNeeded,
      metrics,
      stageConversionPercentages,
      conversionRate,
    }),
  );
});

router.get("/admin/leads", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const queryInput = {
    ...req.query,
    from: typeof req.query.from === "string" ? new Date(req.query.from) : undefined,
    to: typeof req.query.to === "string" ? new Date(req.query.to) : undefined,
  };
  const query = ListRepairLeadsQueryParams.safeParse(queryInput);
  if (!query.success) {
    res.status(400).json({ error: "Invalid lead filters" });
    return;
  }
  const filters: SQL[] = [];
  if (query.data.status) filters.push(eq(repairLeadsTable.status, query.data.status));
  if (query.data.source) filters.push(eq(repairLeadsTable.source, query.data.source));
  if (query.data.intakeMode)
    filters.push(eq(repairLeadsTable.intakeMode, query.data.intakeMode));
  if (query.data.from) filters.push(gte(repairLeadsTable.createdAt, query.data.from));
  if (query.data.to) filters.push(lte(repairLeadsTable.createdAt, query.data.to));
  if (query.data.search) {
    const pattern = `%${query.data.search}%`;
    const search = or(
      ilike(repairLeadsTable.name, pattern),
      ilike(repairLeadsTable.email, pattern),
      ilike(repairLeadsTable.phone, pattern),
      ilike(repairLeadsTable.watchBrand, pattern),
      ilike(repairLeadsTable.description, pattern),
    );
    if (search) filters.push(search);
  }
  const leads = await db
    .select()
    .from(repairLeadsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(repairLeadsTable.createdAt))
    .limit(query.data.limit)
    .offset(query.data.offset);
  res.json(ListRepairLeadsResponse.parse(leads.map(omitNulls)));
});

router.get("/admin/leads/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = GetRepairLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lead id" });
    return;
  }
  const [lead] = await db
    .select()
    .from(repairLeadsTable)
    .where(eq(repairLeadsTable.id, params.data.id))
    .limit(1);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [attachments, events, followUps] = await Promise.all([
    db
      .select()
      .from(leadAttachmentsTable)
      .where(eq(leadAttachmentsTable.leadId, lead.id))
      .orderBy(asc(leadAttachmentsTable.createdAt)),
    db
      .select()
      .from(leadEventsTable)
      .where(eq(leadEventsTable.leadId, lead.id))
      .orderBy(desc(leadEventsTable.createdAt)),
    db
      .select()
      .from(followUpTasksTable)
      .where(eq(followUpTasksTable.leadId, lead.id))
      .orderBy(asc(followUpTasksTable.dueAt)),
  ]);
  res.json(
    GetRepairLeadResponse.parse({
      lead: omitNulls(lead),
      attachments,
      events,
      followUps,
    }),
  );
});

const EDITABLE_DETAIL_FIELDS = [
  "name",
  "email",
  "phone",
  "preferredChannel",
  "serviceNeeded",
  "watchBrand",
  "description",
  "intakeMode",
  "adminOwner",
  "adminSummary",
] as const;

type LeadUpdateInput = ReturnType<typeof UpdateRepairLeadBody.parse>;

/** Trim text and store blank optional fields as null. Consent/attribution are never accepted. */
function normalizeLeadUpdate(input: LeadUpdateInput) {
  const optional = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };
  const changes: Partial<typeof repairLeadsTable.$inferInsert> = {};
  if (input.name !== undefined) changes.name = input.name.trim();
  if (input.email !== undefined) changes.email = optional(input.email)?.toLowerCase() ?? null;
  if (input.phone !== undefined) changes.phone = optional(input.phone);
  if (input.preferredChannel !== undefined) changes.preferredChannel = input.preferredChannel;
  if (input.serviceNeeded !== undefined) changes.serviceNeeded = optional(input.serviceNeeded);
  if (input.watchBrand !== undefined) changes.watchBrand = optional(input.watchBrand);
  if (input.description !== undefined) changes.description = input.description.trim();
  if (input.intakeMode !== undefined) changes.intakeMode = input.intakeMode;
  if (input.status !== undefined) changes.status = input.status;
  if (input.adminOwner !== undefined) changes.adminOwner = optional(input.adminOwner);
  if (input.adminSummary !== undefined) changes.adminSummary = optional(input.adminSummary);
  return changes;
}

router.patch("/admin/leads/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateRepairLeadParams.safeParse(req.params);
  const body = UpdateRepairLeadBody.safeParse(req.body);
  if (
    !params.success ||
    !body.success ||
    Object.keys(body.success ? body.data : {}).length === 0
  ) {
    const field = !body.success ? body.error.issues[0]?.path[0] : undefined;
    res.status(400).json({
      error: field ? `Invalid ${String(field)}. Check the value and try again.` : "Invalid lead update",
    });
    return;
  }
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(repairLeadsTable)
      .where(eq(repairLeadsTable.id, params.data.id))
      .limit(1);
    if (!existing) return { kind: "not_found" as const };
    const changes = normalizeLeadUpdate(body.data);
    if (changes.name === "") return { kind: "invalid" as const, error: "Name is required." };
    if (changes.description === "") {
      return { kind: "invalid" as const, error: "Repair description is required." };
    }
    const nextEmail = "email" in changes ? changes.email : existing.email;
    const nextPhone = "phone" in changes ? changes.phone : existing.phone;
    const nextChannel = changes.preferredChannel ?? existing.preferredChannel;
    if (!nextEmail && !nextPhone) {
      return { kind: "invalid" as const, error: "Keep at least a phone number or an email address." };
    }
    if (nextChannel === "email" && !nextEmail) {
      return { kind: "invalid" as const, error: "Email follow-up needs an email address." };
    }
    if ((nextChannel === "phone" || nextChannel === "sms") && !nextPhone) {
      return { kind: "invalid" as const, error: "Phone or text follow-up needs a phone number." };
    }
    const [lead] = await tx
      .update(repairLeadsTable)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(repairLeadsTable.id, existing.id))
      .returning();
    const editedFields = EDITABLE_DETAIL_FIELDS.filter(
      (field) => field in changes && changes[field] !== existing[field],
    );
    if (editedFields.length) {
      await tx.insert(leadEventsTable).values({
        leadId: existing.id,
        type: "details_edited",
        actorUserId: ADMIN_ACTOR_ID,
        metadata: { fields: editedFields },
      });
    }
    if (body.data.status && body.data.status !== existing.status) {
      await tx.insert(leadEventsTable).values({
        leadId: existing.id,
        type: "status_changed",
        fromStatus: existing.status,
        toStatus: body.data.status,
        actorUserId: ADMIN_ACTOR_ID,
      });
    }
    if (
      body.data.status &&
      ["watch_received", "won", "lost"].includes(body.data.status)
    ) {
      await tx
        .update(followUpTasksTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(followUpTasksTable.leadId, existing.id),
            eq(followUpTasksTable.status, "pending"),
          ),
        );
    }
    return { kind: "ok" as const, lead };
  });
  if (updated.kind === "not_found") {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (updated.kind === "invalid") {
    res.status(400).json({ error: updated.error });
    return;
  }
  res.json(UpdateRepairLeadResponse.parse(omitNulls(updated.lead)));
});

router.post("/admin/leads/:id/notes", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = AddRepairLeadNoteParams.safeParse(req.params);
  const body = AddRepairLeadNoteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid note" });
    return;
  }
  const [lead] = await db
    .select({ id: repairLeadsTable.id })
    .from(repairLeadsTable)
    .where(eq(repairLeadsTable.id, params.data.id))
    .limit(1);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [event] = await db
    .insert(leadEventsTable)
    .values({
      leadId: lead.id,
      type: "note",
      note: body.data.note,
      actorUserId: ADMIN_ACTOR_ID,
    })
    .returning();
  res.status(201).json(AddRepairLeadNoteResponse.parse(event));
});

router.get(
  "/admin/leads/:id/attachments/:attachmentId",
  async (req, res): Promise<void> => {
    if (!requireAdmin(req, res)) return;
    const params = DownloadRepairLeadAttachmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid attachment id" });
      return;
    }
    const [attachment] = await db
      .select()
      .from(leadAttachmentsTable)
      .where(
        and(
          eq(leadAttachmentsTable.id, params.data.attachmentId),
          eq(leadAttachmentsTable.leadId, params.data.id),
        ),
      )
      .limit(1);
    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }
    try {
      const file = await getPrivateObject(attachment.objectPath, params.data.id);
      await pipePrivateObject(file, res);
    } catch {
      res.status(404).json({ error: "Attachment object not found" });
    }
  },
);

router.get("/admin/follow-ups", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const query = ListFollowUpsQueryParams.safeParse({
    ...req.query,
    dueBefore:
      typeof req.query.dueBefore === "string"
        ? new Date(req.query.dueBefore)
        : undefined,
  });
  if (!query.success) {
    res.status(400).json({ error: "Invalid follow-up filters" });
    return;
  }
  const filters: SQL[] = [];
  if (query.data.status) filters.push(eq(followUpTasksTable.status, query.data.status));
  if (query.data.dueBefore)
    filters.push(lte(followUpTasksTable.dueAt, query.data.dueBefore));
  const tasks = await db
    .select()
    .from(followUpTasksTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(followUpTasksTable.dueAt));
  res.json(ListFollowUpsResponse.parse(tasks));
});

router.patch("/admin/follow-ups/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateFollowUpParams.safeParse(req.params);
  const body = UpdateFollowUpBody.safeParse(req.body);
  if (
    !params.success ||
    !body.success ||
    Object.keys(body.success ? body.data : {}).length === 0
  ) {
    res.status(400).json({ error: "Invalid follow-up update" });
    return;
  }
  const [existing] = await db
    .select()
    .from(followUpTasksTable)
    .where(eq(followUpTasksTable.id, params.data.id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Follow-up not found" });
    return;
  }
  if (body.data.dueAt && body.data.dueAt <= existing.createdAt) {
    res.status(400).json({ error: "Follow-up due date must be after submission" });
    return;
  }
  const [task] = await db
    .update(followUpTasksTable)
    .set({
      ...body.data,
      completedAt:
        body.data.status === "completed"
          ? new Date()
          : body.data.status
            ? null
            : undefined,
      updatedAt: new Date(),
    })
    .where(eq(followUpTasksTable.id, params.data.id))
    .returning();
  res.json(UpdateFollowUpResponse.parse(task));
});

export default router;