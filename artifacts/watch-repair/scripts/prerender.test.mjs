import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { renderDocument, renderSitemap, renderLlms, PUBLIC_PATHS, site } from './prerender-document.mjs';

const output = path.resolve(import.meta.dirname, '../dist/public');
const read = (route) => readFile(path.join(output, route === '/' ? 'index.html' : `${route.slice(1)}.html`), 'utf8');

test('every sitemap destination has primary text, unique metadata and a primary-domain canonical', async () => {
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > PUBLIC_PATHS.length);
  const titles = new Set();
  for (const url of urls) {
    assert.ok(url.startsWith(site.siteUrl));
    const route = url.slice(site.siteUrl.length);
    assert.ok(!site.retiredPaths.includes(route));
    const html = await read(route);
    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>\s*(?:<script id="published-guide-snapshot"|<\/body>)/);
    assert.ok(rootMatch, `Rendered root not found on ${route}`);
    const root = rootMatch[1];
    assert.match(root, /<h1[\s>]/);
    assert.ok(root.replace(/<[^>]+>/g, '').length > 200, `${route} has primary text`);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes(`rel="canonical" href="${url}"`));
    assert.equal((html.match(/name="description"/g) || []).length, 1);
    assert.equal((html.match(/<title>/g) || []).length, 1);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title), `Duplicate title on ${route}`);
    titles.add(title);
    const schema = JSON.parse(html.match(/<script id="local-business-jsonld" type="application\/ld\+json">([^<]+)<\/script>/)[1]);
    assert.equal(schema['@type'], 'LocalBusiness');
    assert.equal(schema.url, site.siteUrl);
    assert.ok(schema.address.streetAddress);
    await access(path.join(output, new URL(schema.image).pathname));
    assert.doesNotMatch(root, /href="\/services\/jewelry-repair"/);
    if (route.startsWith('/guides/')) {
      assert.match(root, /data-testid="guide-body"/);
      assert.match(root, /<h2[\s>]/);
      const article = JSON.parse(html.match(/<script id="article-jsonld" type="application\/ld\+json">([^<]+)<\/script>/)[1]);
      assert.equal(article.mainEntityOfPage['@id'], url);
      assert.ok(article.headline);
      assert.match(html, /published-guide-snapshot/);
    }
  }
  for (const route of PUBLIC_PATHS) assert.ok(urls.includes(site.siteUrl + route));
});

test('retired URLs are noindex redirects, not published articles', async () => {
  for (const route of site.retiredPaths) {
    const html = await read(route);
    assert.match(html, /noindex, follow/);
    assert.ok(html.includes(`content="0; url=${site.redirectTarget}"`));
    assert.ok(html.includes(`rel="canonical" href="${site.siteUrl}${site.redirectTarget}"`));
    assert.doesNotMatch(html, /article-jsonld|published-guide-snapshot/);
  }
  const robots = await readFile(path.join(output, 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${site.siteUrl}/sitemap.xml`));
  const fallback = await readFile(path.join(output, 'app.html'), 'utf8');
  assert.match(fallback, /noindex, follow/);
  assert.doesNotMatch(fallback, /rel="canonical"/);
});

test('metadata and snapshot escaping cannot break out into markup', () => {
  const html = renderDocument('<html><head><title>Shell</title></head><body><div id="root"></div></body></html>',
    '/guides/test', '<main><h1>Guide</h1></main>',
    { title: '<script>bad</script>', description: '" < > &' },
    [{ body: '</script><script>alert(1)</script>' }]);
  assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
  assert.ok(html.includes('\\u003c/script>'));
  assert.equal((html.match(/<script/g) || []).length, 1);
  const sitemap = renderSitemap(['/', '/repair', '/repair', ...site.retiredPaths]);
  assert.equal((sitemap.match(/<loc>/g) || []).length, 2);
});

test('static production rewrites resolve public destinations to their generated documents', async () => {
  const manifest = await readFile(path.resolve(import.meta.dirname, '../.replit-artifact/artifact.toml'), 'utf8');
  const rewrites = [...manifest.matchAll(/\[\[services\.production\.rewrites\]\]\s*from = "([^"]+)"\s*to = "([^"]+)"/g)]
    .map((match) => ({ from: match[1], to: match[2] }));
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const route = url.slice(site.siteUrl.length);
    if (route === '/') continue; // Root index is served directly.
    const rule = rewrites.find(({ from }) => from === route || (from.endsWith('*') && route.startsWith(from.slice(0, -1))));
    assert.ok(rule, `No static route mapping for ${route}`);
    const file = rule.to.includes('*') ? rule.to.replace('*', route.slice(rule.from.length - 1)) : rule.to;
    assert.notEqual(file, '/app.html', `Public route fell through to empty shell: ${route}`);
    await access(path.join(output, file));
  }
  assert.equal(rewrites.at(-1).to, '/app.html');
});

test('closed service FAQs include representative answers in initial HTML', async () => {
  for (const [route, answers] of [
    ['/services/watch-repair', ['A complete mechanical overhaul typically takes one to three weeks']],
    ['/services/battery-replacement', [
      'Battery replacement ranges from $15 to $50',
      'We check the gaskets and pressure-test the case where applicable at no additional charge',
    ]],
  ]) {
    const html = await read(route);
    // Inspect the rendered FAQ regions, not repeated hero copy or a data snapshot.
    const closedRegions = [...html.matchAll(/<div\b(?=[^>]*role="region")(?=[^>]*data-state="closed")[^>]*>([\s\S]*?)<\/div><\/div>/g)];
    assert.ok(closedRegions.length > 0, `${route} has server-rendered closed FAQ regions`);
    for (const answer of answers) {
      const region = closedRegions.find(([markup]) => markup.includes(answer));
      assert.ok(region, `Missing FAQ answer on ${route}: ${answer}`);
      assert.ok(region[0].includes('data-[state=closed]:hidden'), 'Closed content must be display:none, not just transparent');
    }
    assert.match(html, /aria-expanded="false"/);
  }
});

test('visible trails and BreadcrumbList match on services and other public pages', async () => {
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  const guideRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].slice(site.siteUrl.length)).filter((route) => route.startsWith('/guides/'));
  assert.ok(guideRoutes.length > 0);
  const expected = [
    ['/services/watch-repair', 'Watch Repair'],
    ['/services/battery-replacement', 'Battery Replacement'],
    ['/about', 'About'], ['/book', 'Book'], ['/guides', 'Guides'],
    ...guideRoutes.map((route) => [route, null]),
  ];
  for (const [route, name] of expected) {
    const html = await read(route);
    const scripts = [...html.matchAll(/<script id="breadcrumb-jsonld" type="application\/ld\+json">([^<]+)<\/script>/g)];
    assert.equal(scripts.length, 1, `Exactly one breadcrumb schema on ${route}`);
    const schema = JSON.parse(scripts[0][1]);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'BreadcrumbList');
    const items = schema.itemListElement;
    const paths = route.startsWith('/guides/') ? ['/', '/guides', route] : ['/', route];
    assert.deepEqual(items.map((item) => item.item), paths.map((path) => site.siteUrl + path));
    assert.deepEqual(items.map((item) => item.position), paths.map((_, i) => i + 1));
    assert.ok(items.every((item) => item['@type'] === 'ListItem' && item.name));
    assert.equal(items[0].name, 'Home');
    if (name) assert.equal(items.at(-1).name, name);
    if (route.startsWith('/guides/')) {
      assert.equal(items[1].name, 'Guides');
      const article = JSON.parse(html.match(/<script id="article-jsonld" type="application\/ld\+json">([^<]+)<\/script>/)[1]);
      assert.equal(items.at(-1).name, article.headline);
    }
    const nav = html.match(/<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.match(nav, /aria-current="page"/);
    for (const path of paths.slice(0, -1)) assert.ok(nav.includes(`href="${path}"`));
    assert.doesNotMatch(nav, />Services</);
    // Decode React text escaping before comparing guide titles to schema names.
    const text = nav.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    for (const item of items) assert.ok(text.includes(item.name));
  }
});

test('llms discovery includes only canonical published guide links and real public pages', async () => {
  const llms = await readFile(path.join(output, 'llms.txt'), 'utf8');
  assert.ok(llms.startsWith('# Upper East Watch Repair\n'));
  assert.doesNotMatch(llms, /<html|<div|\/admin|\/repair\/intake\/in-store|\/services\/jewelry|\/guides\/jewelry/);
  const links = [...llms.matchAll(/\]\(([^)]+)\): (\S[^\n]*)/g)];
  assert.ok(links.length > 5);
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  for (const [, url] of links) {
    assert.ok(url.startsWith(site.siteUrl + '/'));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `Discovery link must be a published canonical: ${url}`);
    await read(url.slice(site.siteUrl.length));
  }
  const hub = await read('/guides');
  const snapshot = JSON.parse(hub.match(/<script id="published-guide-snapshot" type="application\/json">([^<]+)<\/script>/)[1]);
  for (const guide of snapshot) assert.ok(llms.includes(`](${site.siteUrl}/guides/${guide.slug}): `));
  assert.equal(links.filter(([, url]) => url.startsWith(site.siteUrl + '/guides/')).length, snapshot.length);
  assert.equal(llms, await readFile(path.resolve(import.meta.dirname, '../public/llms.txt'), 'utf8'));

  const generated = renderLlms([
    { slug: 'watch-care', title: 'Care [guide]\nTitle', excerpt: 'Short\nsummary', status: 'published' },
    { slug: 'draft', title: 'Private', status: 'draft' },
    { slug: 'jewelry-repair-cost-nyc', title: 'Retired', status: 'published' },
  ]);
  assert.ok(generated.includes(`[Care \\[guide\\] Title](${site.siteUrl}/guides/watch-care): Short summary`));
  assert.doesNotMatch(generated, /\/guides\/draft|\/guides\/jewelry-repair-cost-nyc/);
  assert.ok(!renderLlms([]).includes('/guides/watch-care'), 'Unpublished guides disappear on regeneration');
});
