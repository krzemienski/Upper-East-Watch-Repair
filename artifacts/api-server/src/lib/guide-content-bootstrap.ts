import { pool } from "@workspace/db";
import site from "../../../../content/site.json";
import retiredRecommendations from "../../../../content/guide-migrations.json";

import toolsGuide from "../../../../content/guides/best-watch-repair-tools-amazon.md";
import serviceGuide from "../../../../content/guides/how-often-should-a-watch-be-serviced.md";
import batteryDiyGuide from "../../../../content/guides/how-to-replace-watch-battery-at-home.md";
import vintageCareGuide from "../../../../content/guides/vintage-watch-care-guide.md";
import batteryCostGuide from "../../../../content/guides/watch-battery-replacement-cost-nyc.md";
import watchCostGuide from "../../../../content/guides/watch-repair-cost-nyc.md";
import waterResistanceGuide from "../../../../content/guides/watch-water-resistance-pressure-testing.md";

const WORKBENCH_OG_IMAGE =
  `${site.siteUrl}/media/upper-east-watch-repair-workbench-og.webp`;
const ROLEX_GUIDE_SLUG = "how-much-is-my-rolex-worth";
const ROLEX_LEGACY_META_DESCRIPTION =
  "Learn how Rolex watches are valued: reference numbers, condition, provenance, and market demand—plus when to get a professional appraisal in NYC.";
const ROLEX_META_DESCRIPTION =
  "Learn how Rolex watches are valued by reference, condition, provenance, originality, and market demand, plus when to seek a professional appraisal in NYC.";
const GUIDE_AUTHOR = "Upper East Watch Repair";

const newGuideSources = [
  toolsGuide,
  batteryDiyGuide,
  watchCostGuide,
  waterResistanceGuide,
];

const legacyDraftGuides = [
  {
    source: serviceGuide,
    bodyHash: "911d38faa669a4e911e066721c95e291",
  },
  {
    source: vintageCareGuide,
    bodyHash: "2d5b76e6468a616b8b2ef77e9661ce5d",
  },
  {
    source: batteryCostGuide,
    bodyHash: "de9420abc49574a5b4e942fde4523663",
  },
];

interface BundledGuide {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: "published";
  publishedAt: string;
  metaDescription: string;
}

function parseBundledGuide(source: string): BundledGuide {
  const normalized = source.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/);

  if (!match) {
    throw new Error("Bundled guide is missing valid frontmatter.");
  }

  const metadata = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => {
        const separator = line.indexOf(":");
        return separator > 0
          ? [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
          : null;
      })
      .filter((entry): entry is [string, string] => entry !== null),
  );

  const required = [
    "slug",
    "title",
    "excerpt",
    "status",
    "publishedAt",
    "metaDescription",
  ] as const;

  for (const key of required) {
    if (!metadata[key]) {
      throw new Error(`Bundled guide is missing "${key}" metadata.`);
    }
  }

  if (metadata["status"] !== "published") {
    throw new Error(`Bundled guide "${metadata["slug"]}" must be published.`);
  }

  return {
    slug: metadata["slug"],
    title: metadata["title"],
    excerpt: metadata["excerpt"],
    body: match[2].trim(),
    status: "published",
    publishedAt: metadata["publishedAt"],
    metaDescription: metadata["metaDescription"],
  };
}

export async function bootstrapGuideContent() {
  const newGuides = newGuideSources.map(parseBundledGuide);
  const legacyGuides = legacyDraftGuides.map(({ source, bodyHash }) => ({
    guide: parseBundledGuide(source),
    bodyHash,
  }));
  const client = await pool.connect();
  let insertedGuideCount = 0;
  let upgradedLegacyDraftCount = 0;
  let upgradedRolexMetadataCount = 0;

  try {
    await client.query("BEGIN");

    // Retain the historical record for editors, but never publish a retired service.
    await client.query(
      "UPDATE guides SET status = 'draft', updated_at = now() WHERE slug = $1 AND status = 'published'",
      ["jewelry-repair-cost-nyc"],
    );
    await client.query(
      "UPDATE guides SET og_image = $1 WHERE og_image = $2",
      [WORKBENCH_OG_IMAGE, "https://upper-east-watch-repair.replit.app/media/upper-east-watch-repair-workbench-og.webp"],
    );

    // Replace known bundled recommendations, not just their URLs (which would
    // leave a link promising jewelry repair that actually lands on watch repair).
    // Exact-match substitutions preserve unrelated editor changes.
    for (const { old: oldText, new: newText } of retiredRecommendations) {
      await client.query(
        `UPDATE guides SET body = replace(body, $1, $2), updated_at = now()
         WHERE strpos(body, $1) > 0`,
        [oldText, newText],
      );
    }

    for (const guide of newGuides) {
      const result = await client.query(
        `
          INSERT INTO guides (
            slug,
            title,
            excerpt,
            body,
            author,
            status,
            published_at,
            meta_description,
            og_image,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
          ON CONFLICT (slug) DO NOTHING
          RETURNING slug
        `,
        [
          guide.slug,
          guide.title,
          guide.excerpt,
          guide.body,
          GUIDE_AUTHOR,
          guide.status,
          guide.publishedAt,
          guide.metaDescription,
          WORKBENCH_OG_IMAGE,
        ],
      );

      insertedGuideCount += result.rowCount ?? 0;
    }

    for (const { guide, bodyHash } of legacyGuides) {
      const result = await client.query(
        `
          UPDATE guides
          SET
            title = $2,
            excerpt = $3,
            body = $4,
            author = $5,
            status = $6,
            published_at = $7,
            meta_description = $8,
            og_image = COALESCE(og_image, $9),
            updated_at = now()
          WHERE slug = $1
            AND status = 'draft'
            AND md5(body) = $10
          RETURNING slug
        `,
        [
          guide.slug,
          guide.title,
          guide.excerpt,
          guide.body,
          GUIDE_AUTHOR,
          guide.status,
          guide.publishedAt,
          guide.metaDescription,
          WORKBENCH_OG_IMAGE,
          bodyHash,
        ],
      );

      upgradedLegacyDraftCount += result.rowCount ?? 0;
    }

    const rolexResult = await client.query(
      `
        UPDATE guides
        SET
          meta_description = $1,
          og_image = COALESCE(og_image, $2),
          updated_at = now()
        WHERE slug = $3
          AND meta_description = $4
        RETURNING slug
      `,
      [
        ROLEX_META_DESCRIPTION,
        WORKBENCH_OG_IMAGE,
        ROLEX_GUIDE_SLUG,
        ROLEX_LEGACY_META_DESCRIPTION,
      ],
    );
    upgradedRolexMetadataCount = rolexResult.rowCount ?? 0;

    await client.query("COMMIT");

    return {
      bundledGuideCount: newGuides.length + legacyGuides.length,
      insertedGuideCount,
      upgradedLegacyDraftCount,
      upgradedRolexMetadataCount,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}