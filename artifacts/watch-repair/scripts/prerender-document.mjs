import site from '../../../content/site.json' with { type: 'json' };

export { site };
export const PUBLIC_PATHS = [
  '/', '/services/watch-repair', '/services/battery-replacement',
  '/about', '/book', '/repair', '/repair/intake', '/guides',
];

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

export function renderDocument(template, route, body, metadata, guides = [], options = {}) {
  const title = metadata.title.includes('Upper East') ? metadata.title : `${metadata.title} | Upper East Watch Repair`;
  const canonical = metadata.canonical || (route ? `${site.siteUrl}${route}` : null);
  const image = metadata.image || `${site.siteUrl}/og/upper-east-watch-repair-share.png`;
  const imageType = /\.webp(?:[?#]|$)/i.test(image) ? 'image/webp' : 'image/png';
  const imageAlt = image.includes('workbench')
    ? 'Watch repair workbench at Upper East Watch Repair.'
    : 'Upper East Watch Repair, 233 East 84th Street, New York. Start repair quote.';
  // Remove shell metadata before writing the route's values: exactly one of each signal.
  let html = template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  const tag = (key, value, attribute = 'name') => `<meta ${attribute}="${key}" content="${escape(value)}" />`;
  const head = [
    `<title>${escape(title)}</title>`,
    tag('description', metadata.description),
    tag('robots', options.noindex ? 'noindex, follow' : 'index, follow'),
    tag('og:title', title, 'property'),
    tag('og:description', metadata.description, 'property'),
    tag('og:type', route.startsWith('/guides/') && !options.redirect ? 'article' : 'website', 'property'),
    tag('og:image', image, 'property'),
    tag('og:image:width', '1200', 'property'),
    tag('og:image:height', '630', 'property'),
    tag('og:image:type', imageType, 'property'),
    tag('og:image:alt', imageAlt, 'property'),
    tag('og:site_name', 'Upper East Watch Repair', 'property'),
    tag('og:locale', 'en_US', 'property'),
    tag('twitter:card', 'summary_large_image'),
    tag('twitter:title', title),
    tag('twitter:description', metadata.description),
    tag('twitter:image', image),
    tag('twitter:image:alt', imageAlt),
    ...(canonical ? [`<link rel="canonical" href="${escape(canonical)}" />`, tag('og:url', canonical, 'property')] : []),
    ...(options.redirect ? [`<meta http-equiv="refresh" content="0; url=${escape(options.redirect)}" />`] : []),
  ].join('\n    ');
  html = html.replace('</head>', `${head}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (guides.length) html = html.replace('</body>',
    `<script id="published-guide-snapshot" type="application/json">${json(guides)}</script>\n</body>`);
  return html;
}

export function renderSitemap(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    [...new Set(routes)].filter((route) => !site.retiredPaths.includes(route))
      .map((route) => `  <url><loc>${escape(site.siteUrl + route)}</loc></url>`).join('\n')
  }\n</urlset>\n`;
}

export function renderRobots() {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /repair/intake/in-store\nSitemap: ${site.siteUrl}/sitemap.xml\n`;
}
