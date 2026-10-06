import { renderDocument, renderSitemap, renderRobots, PUBLIC_PATHS, site } from './prerender-document.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Development preview serves real response HTML too, not a different crawler-only page. */
export function prerenderDev() {
  return {
    name: 'public-route-rendering',
    apply: 'serve',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const route = new URL(req.url || '/', 'http://preview.local').pathname.replace(/\/$/, '') || '/';
          const isPublic = PUBLIC_PATHS.includes(route) || route.startsWith('/guides/');
          if (!isPublic && !site.retiredPaths.includes(route) && !['/sitemap.xml', '/robots.txt'].includes(route)) return next();
          try {
            if (route === '/robots.txt') {
              res.setHeader('Content-Type', 'text/plain');
              return res.end(renderRobots());
            }
            const { loadPublishedGuides } = await server.ssrLoadModule('/scripts/load-published-guides.ts');
            const guides = await loadPublishedGuides();
            if (route === '/sitemap.xml') {
              res.setHeader('Content-Type', 'application/xml');
              return res.end(renderSitemap([...PUBLIC_PATHS, ...guides.map((guide) => `/guides/${guide.slug}`)]));
            }
            if (site.retiredPaths.includes(route)) {
              res.statusCode = 301;
              res.setHeader('Location', site.redirectTarget);
              return res.end();
            }
            if (route.startsWith('/guides/') && !guides.some((guide) => route === `/guides/${guide.slug}`)) return next();
            const template = await server.transformIndexHtml(route,
              await readFile(path.join(server.config.root, 'index.html'), 'utf8'));
            const { renderPage } = await server.ssrLoadModule('/src/entry-prerender.tsx');
            const { body, metadata } = renderPage(route, guides);
            const snapshot = route === '/guides' ? guides : guides.filter((guide) => route === `/guides/${guide.slug}`);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(renderDocument(template, route, body, metadata, snapshot));
          } catch (error) {
            server.ssrFixStacktrace(error);
            next(error);
          }
        });
    },
  };
}
