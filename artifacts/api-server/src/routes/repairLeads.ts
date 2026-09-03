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
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { isAdminUser } from "../lib/admin";
import {
  createLeadUploadUrl,
  getPrivateObject,
  inspectPrivateObject,
  pipePrivateObject,
} from "../lib/objectStorage";

const router: IRouter = Router();
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES = 5;
const MAX_SIZE = 8 * 1024 * 1024;

function requireAdmin(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (!isAdminUser(req.user)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
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
  const [{ value: attachmentCount }] = await db
    .select({ value: count() })
    .from(leadAttachmentsTable)
    .where(eq(leadAttachmentsTable.leadId, params.data.id));
  if (attachmentCount >= MAX_IMAGES) {
    res.status(400).json({ error: "A lead may have at most 5 images" });
    return;
  }
  const target = await createLeadUploadUrl(params.data.id);
  res.json(RequestLeadUploadUrlResponse.parse(target));
});

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
  let actual: { contentType: string; size: number };
  try {
    actual = await inspectPrivateObject(body.data.objectPath, params.data.id);
  } catch {
    res.status(400).json({ error: "Uploaded object was not found" });
    return;
  }
  if (
    !imageTypes.has(actual.contentType) ||
    actual.size <= 0 ||
    actual.size > MAX_SIZE ||
    actual.contentType !== body.data.contentType ||
    actual.size !== body.data.size
  ) {
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
      const [{ value }] = await tx
        .select({ value: count() })
        .from(leadAttachmentsTable)
        .where(eq(leadAttachmentsTable.leadId, params.data.id));
      if (value >= MAX_IMAGES) throw new Error("IMAGE_LIMIT");
      const [created] = await tx
        .insert(leadAttachmentsTable)
        .values({
          leadId: params.data.id,
          objectPath: body.data.objectPath,
          originalName: body.data.name,
          contentType: actual.contentType,
          size: actual.size,
        })
        .returning();
      return created;
    });
    res.status(201).json(FinalizeLeadAttachmentResponse.parse(attachment));
  } catch (error) {
    if (error instanceof Error && error.message === "IMAGE_LIMIT") {
      res.status(400).json({ error: "A lead may have at most 5 images" });
      return;
    }
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

router.patch("/admin/leads/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateRepairLeadParams.safeParse(req.params);
  const body = UpdateRepairLeadBody.safeParse(req.body);
  if (
    !params.success ||
    !body.success ||
    Object.keys(body.success ? body.data : {}).length === 0
  ) {
    res.status(400).json({ error: "Invalid lead update" });
    return;
  }
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(repairLeadsTable)
      .where(eq(repairLeadsTable.id, params.data.id))
      .limit(1);
    if (!existing) return null;
    const [lead] = await tx
      .update(repairLeadsTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(repairLeadsTable.id, existing.id))
      .returning();
    if (body.data.status && body.data.status !== existing.status) {
      await tx.insert(leadEventsTable).values({
        leadId: existing.id,
        type: "status_changed",
        fromStatus: existing.status,
        toStatus: body.data.status,
        actorUserId: req.user!.id,
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
    return lead;
  });
  if (!updated) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(UpdateRepairLeadResponse.parse(omitNulls(updated)));
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
      actorUserId: req.user!.id,
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