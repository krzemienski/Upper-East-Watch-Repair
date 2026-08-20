import {
  CreateGuideBody,
  CreateGuideResponse,
  GetGuideSummaryResponse,
  GetPublishedGuideParams,
  GetPublishedGuideResponse,
  ListAdminGuidesResponse,
  ListPublishedGuidesResponse,
  UpdateGuideBody,
  UpdateGuideParams,
  UpdateGuideResponse,
} from "@workspace/api-zod";
import { db, guidesTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { isAdminUser } from "../lib/admin";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    req.log.warn("Rejected unauthenticated guide-editor request");
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  if (isAdminUser(req.user)) return true;

  req.log.warn(
    { userId: req.user.id },
    "Rejected guide-editor request from non-admin user",
  );
  res.status(403).json({ error: "Forbidden" });
  return false;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

router.get("/guides", async (req, res): Promise<void> => {
  const guides = await db
    .select()
    .from(guidesTable)
    .where(eq(guidesTable.status, "published"))
    .orderBy(desc(guidesTable.publishedAt), desc(guidesTable.createdAt));

  req.log.debug({ count: guides.length }, "Listed published guides");
  res.json(ListPublishedGuidesResponse.parse(guides));
});

router.get("/guides/:slug", async (req, res): Promise<void> => {
  const params = GetPublishedGuideParams.safeParse(req.params);
  if (!params.success) {
    req.log.warn({ errors: params.error.issues }, "Invalid guide slug");
    res.status(400).json({ error: "Invalid guide slug" });
    return;
  }

  const [guide] = await db
    .select()
    .from(guidesTable)
    .where(
      and(
        eq(guidesTable.slug, params.data.slug),
        eq(guidesTable.status, "published"),
      ),
    )
    .limit(1);

  if (!guide) {
    res.status(404).json({ error: "Guide not found" });
    return;
  }

  res.json(GetPublishedGuideResponse.parse(guide));
});

router.get("/admin/guides", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const guides = await db
    .select()
    .from(guidesTable)
    .orderBy(desc(guidesTable.updatedAt), desc(guidesTable.createdAt));

  req.log.debug(
    { count: guides.length, userId: req.user?.id },
    "Listed guides for editor",
  );
  res.json(ListAdminGuidesResponse.parse(guides));
});

router.get("/admin/guides/summary", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const [summary] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published:
        sql<number>`count(*) filter (where ${guidesTable.status} = 'published')::int`,
      drafts:
        sql<number>`count(*) filter (where ${guidesTable.status} = 'draft')::int`,
    })
    .from(guidesTable);

  res.json(
    GetGuideSummaryResponse.parse(summary ?? { total: 0, published: 0, drafts: 0 }),
  );
});

router.post("/admin/guides", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const body = CreateGuideBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ errors: body.error.issues }, "Invalid guide create body");
    res.status(400).json({ error: "Invalid guide content" });
    return;
  }

  try {
    const [guide] = await db
      .insert(guidesTable)
      .values({
        ...body.data,
        ogImage: body.data.ogImage ?? null,
        publishedAt: body.data.status === "published" ? new Date() : null,
      })
      .returning();

    req.log.info(
      { guideId: guide.id, status: guide.status, userId: req.user?.id },
      "Created guide",
    );
    res.status(201).json(CreateGuideResponse.parse(guide));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(400).json({ error: "A guide with this slug already exists" });
      return;
    }
    throw error;
  }
});

router.patch("/admin/guides/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = UpdateGuideParams.safeParse(req.params);
  const body = UpdateGuideBody.safeParse(req.body);
  if (!params.success || !body.success) {
    req.log.warn(
      {
        paramErrors: params.success ? undefined : params.error.issues,
        bodyErrors: body.success ? undefined : body.error.issues,
      },
      "Invalid guide update request",
    );
    res.status(400).json({ error: "Invalid guide update" });
    return;
  }

  const [existing] = await db
    .select({
      id: guidesTable.id,
      publishedAt: guidesTable.publishedAt,
      status: guidesTable.status,
    })
    .from(guidesTable)
    .where(eq(guidesTable.id, params.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Guide not found" });
    return;
  }

  const publishedAt =
    body.data.status === "published"
      ? (existing.publishedAt ?? new Date())
      : body.data.status === "draft"
        ? null
        : existing.publishedAt;

  try {
    const [guide] = await db
      .update(guidesTable)
      .set({
        ...body.data,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(guidesTable.id, params.data.id))
      .returning();

    req.log.info(
      { guideId: guide.id, status: guide.status, userId: req.user?.id },
      "Updated guide",
    );
    res.json(UpdateGuideResponse.parse(guide));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(400).json({ error: "A guide with this slug already exists" });
      return;
    }
    throw error;
  }
});

export default router;