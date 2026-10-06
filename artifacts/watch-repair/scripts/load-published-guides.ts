import { pool } from '@workspace/db';
import site from '../../../content/site.json';
import migrations from '../../../content/guide-migrations.json';

/** Read-only snapshot of the same published records the public API serves. */
export async function loadPublishedGuides() {
  const result = await pool.query(`
    SELECT id, slug, title, excerpt, body, author, status,
      published_at AS "publishedAt", meta_description AS "metaDescription",
      og_image AS "ogImage", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM guides WHERE status = 'published'
    ORDER BY published_at DESC, created_at DESC
  `);
  return JSON.parse(JSON.stringify(result.rows)).filter(
    (guide: { slug: string }) => !site.retiredPaths.includes(`/guides/${guide.slug}`),
  ).map((guide: { body: string; ogImage: string | null }) => ({
    ...guide,
    // Static builds precede API startup: apply the same exact migrations read-only.
    body: migrations.reduce((body, change) => body.replaceAll(change.old, change.new), guide.body),
    ogImage: guide.ogImage === 'https://upper-east-watch-repair.replit.app/media/upper-east-watch-repair-workbench-og.webp'
      ? `${site.siteUrl}/media/upper-east-watch-repair-workbench-og.webp` : guide.ogImage,
  }));
}

export async function closeGuideConnection() {
  await pool.end();
}
