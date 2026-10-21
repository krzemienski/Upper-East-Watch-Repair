import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { renderDocument, renderSitemap, renderRobots, renderLlms, PUBLIC_PATHS, site } from './prerender-document.mjs';

const artifactDir = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(artifactDir, 'dist/public');
const template = await readFile(path.join(publicDir, 'index.html'), 'utf8');
// Use Vite's server module loader so SSR uses the same aliases/env/components as the client.
const server = await createServer({
  configFile: path.join(artifactDir, 'vite.config.ts'),
  mode: 'production',
  server: { middlewareMode: true },
  appType: 'custom',
});
let closeGuideConnection;
try {
  const loader = await server.ssrLoadModule('/scripts/load-published-guides.ts');
  closeGuideConnection = loader.closeGuideConnection;
  const guides = await loader.loadPublishedGuides();
  const { renderPage } = await server.ssrLoadModule('/src/entry-prerender.tsx');
  const routes = [...PUBLIC_PATHS, ...guides.map((guide) => `/guides/${guide.slug}`)];
  for (const route of routes) {
    const { body, metadata } = renderPage(route, guides);
    // Only serialize the guide(s) this page needs; never include private guide records.
    const snapshot = route === '/guides' ? guides
      : guides.filter((guide) => route === `/guides/${guide.slug}`);
    await writeRoute(route, renderDocument(template, route, body, metadata, snapshot));
  }
  for (const route of site.retiredPaths) {
    await writeRoute(route, renderDocument(template, route,
      `<main><h1>This page has moved</h1><p>Jewelry repair is no longer offered. See our <a href="${site.redirectTarget}">watch repair service</a>.</p></main>`,
      { title: 'Watch Repair | Upper East Watch Repair', description: 'Jewelry repair is no longer offered.', canonical: `${site.siteUrl}${site.redirectTarget}` },
      [], { redirect: site.redirectTarget, noindex: true }));
  }
  // Never give private/unknown SPA routes the homepage's canonical or index directive.
  const fallback = renderDocument(template, '', '', {
    title: 'Upper East Watch Repair', description: 'Upper East Watch Repair',
  }, [], { noindex: true });
  await writeFile(path.join(publicDir, 'app.html'), fallback);
  for (const route of ['/admin', '/admin/leads', '/repair/intake/in-store']) await writeRoute(route, fallback);
  await writeFile(path.join(publicDir, 'sitemap.xml'), renderSitemap(routes));
  await writeFile(path.join(publicDir, 'robots.txt'), renderRobots());
  await writeFile(path.join(publicDir, 'llms.txt'), renderLlms(guides));
  // Keep source discovery files synchronized as well; domain/route edits cannot drift.
  await writeFile(path.join(artifactDir, 'public/sitemap.xml'), renderSitemap(routes));
  await writeFile(path.join(artifactDir, 'public/robots.txt'), renderRobots());
  await writeFile(path.join(artifactDir, 'public/llms.txt'), renderLlms(guides));
  console.info(`Rendered full HTML for ${routes.length} public routes (${guides.length} published guides).`);
} finally {
  await closeGuideConnection?.();
  await server.close();
}

async function writeRoute(route, html) {
  if (route === '/') return writeFile(path.join(publicDir, 'index.html'), html);
  const relative = route.replace(/^\//, '');
  if (!/^[a-z0-9/-]+$/.test(relative) || relative.includes('..')) throw new Error(`Unsafe route: ${route}`);
  const directory = path.join(publicDir, relative);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
  await writeFile(path.join(publicDir, `${relative}.html`), html);
}
