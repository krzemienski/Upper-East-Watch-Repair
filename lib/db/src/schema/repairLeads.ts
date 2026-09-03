import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const leadStatuses = [
  "new",
  "contacted",
  "visit_planned",
  "watch_received",
  "estimate_pending",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const repairLeadsTable = pgTable(
  "repair_leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    preferredChannel: varchar("preferred_channel", { length: 16 })
      .$type<"email" | "phone" | "sms" | "none">()
      .notNull()
      .default("none"),
    emailConsent: boolean("email_consent").notNull().default(false),
    phoneConsent: boolean("phone_consent").notNull().default(false),
    smsConsent: boolean("sms_consent").notNull().default(false),
    serviceNeeded: varchar("service_needed", { length: 120 }),
    watchBrand: varchar("watch_brand", { length: 120 }),
    watchModel: varchar("watch_model", { length: 120 }),
    description: text("description").notNull(),
    intakeMode: varchar("intake_mode", { length: 20 })
      .$type<"mail_in" | "in_store" | "unsure">()
      .notNull()
      .default("unsure"),
    status: varchar("status", { length: 32 })
      .$type<LeadStatus>()
      .notNull()
      .default("new"),
    adminOwner: varchar("admin_owner", { length: 160 }),
    adminSummary: text("admin_summary"),
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmTerm: varchar("utm_term", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),
    referrer: text("referrer"),
    source: varchar("source", { length: 255 }),
    variant: varchar("variant", { length: 120 }),
    device: varchar("device", { length: 80 }),
    selectedCta: varchar("selected_cta", { length: 160 }),
    uploadTokenHash: varchar("upload_token_hash", { length: 64 }).notNull(),
    uploadTokenExpiresAt: timestamp("upload_token_expires_at", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("repair_leads_status_idx").on(table.status),
    index("repair_leads_created_at_idx").on(table.createdAt),
  ],
);

export const leadAttachmentsTable = pgTable(
  "lead_attachments",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => repairLeadsTable.id, { onDelete: "cascade" }),
    objectPath: text("object_path").notNull().unique(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 80 }).notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_attachments_lead_idx").on(table.leadId)],
);

export const leadEventsTable = pgTable(
  "lead_events",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => repairLeadsTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    note: text("note"),
    fromStatus: varchar("from_status", { length: 32 }),
    toStatus: varchar("to_status", { length: 32 }),
    actorUserId: varchar("actor_user_id", { length: 255 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_events_lead_idx").on(table.leadId)],
);

export const followUpTasksTable = pgTable(
  "follow_up_tasks",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => repairLeadsTable.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 16 })
      .$type<"email" | "phone" | "sms">()
      .notNull(),
    status: varchar("status", { length: 16 })
      .$type<"pending" | "completed" | "cancelled">()
      .notNull()
      .default("pending"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("follow_up_tasks_due_idx").on(table.status, table.dueAt),
    index("follow_up_tasks_lead_idx").on(table.leadId),
  ],
);

export const funnelEventsTable = pgTable("funnel_events", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 80 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  leadId: integer("lead_id").references(() => repairLeadsTable.id, {
    onDelete: "set null",
  }),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  referrer: text("referrer"),
  source: varchar("source", { length: 255 }),
  variant: varchar("variant", { length: 120 }),
  device: varchar("device", { length: 80 }),
  selectedCta: varchar("selected_cta", { length: 160 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RepairLead = typeof repairLeadsTable.$inferSelect;
export type LeadAttachment = typeof leadAttachmentsTable.$inferSelect;
export type LeadEvent = typeof leadEventsTable.$inferSelect;
export type FollowUpTask = typeof followUpTasksTable.$inferSelect;