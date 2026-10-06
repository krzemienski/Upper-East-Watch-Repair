import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://uppereastwatchrepair.com";
// Branded 1200x630 PNG share card (public/og). PNG is universally supported by crawlers.
const SHARE_IMAGE = `${SITE_URL}/og/upper-east-watch-repair-share.png`;
const SHARE_IMAGE_ALT = "Upper East Watch Repair, 233 East 84th Street, New York. Start repair quote.";
const WORKBENCH_IMAGE = `${SITE_URL}/media/upper-east-watch-repair-workbench-og.webp`;
const WORKBENCH_IMAGE_ALT = "Watch repair workbench at Upper East Watch Repair.";
// Retired services/guides: never prerender as content; redirect to watch repair.
const RETIRED_PATHS = ["/services/jewelry-repair", "/guides/jewelry-repair-cost-nyc"];
const REDIRECT_TARGET = "/services/watch-repair";
const artifactDir = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(artifactDir, "../..");
const guideSourceDir = path.join(workspaceRoot, "content/guides");
const publicDir = path.join(artifactDir, "dist/public");

const rolexGuide = {
  slug: "how-much-is-my-rolex-worth",
  title: "How Much Is My Rolex Worth? A Complete Valuation Guide",
  metaDescription:
    "Learn how Rolex watches are valued by reference, condition, provenance, originality, and market demand, plus when to seek a professional appraisal in NYC.",
};

function parseGuideFrontmatter(source, fileName) {
  const normalized = source.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    throw new Error(`Guide source "${fileName}" is missing valid frontmatter.`);
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
      .filter((entry) => entry !== null),
  );

  for (const key of ["slug", "title", "metaDescription"]) {
    if (!metadata[key]) {
      throw new Error(`Guide source "${fileName}" is missing "${key}" metadata.`);
    }
  }

  return metadata;
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Expected metadata tag was not found: ${pattern}`);
  }

  return html.replace(pattern, replacement);
}

function renderMetadataDocument(template, {
  title,
  description,
  canonicalPath,
  type,
  robots,
  extraHead = [],
  image = SHARE_IMAGE,
  imageType = "image/png",
  imageAlt = SHARE_IMAGE_ALT,
}) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const safeTitle = escapeAttribute(title);
  const safeDescription = escapeAttribute(description);
  const safeCanonical = escapeAttribute(canonical);
  const safeImage = escapeAttribute(image);

  let html = template;
  // Remove template-level image tags so each route gets exactly one set.
  html = html.replace(/\s*<meta (?:property="og:image[^"]*"|name="twitter:image[^"]*")[^>]*>/g, "");
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  html = replaceTag(
    html,
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${safeDescription}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${safeTitle}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${safeDescription}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${type}" />`,
  );
  if (robots) html = html.replace(/\s*<meta name="robots"[^>]*>/, "");
  html = replaceTag(
    html,
    /<meta name="twitter:card"[^>]*>/,
    `<meta name="twitter:card" content="summary_large_image" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${safeTitle}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${safeDescription}" />`,
  );

  const routeMetadata = [
    `<link rel="canonical" href="${safeCanonical}" />`,
    `<meta property="og:url" content="${safeCanonical}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="${escapeAttribute(imageType)}" />`,
    `<meta property="og:image:alt" content="${escapeAttribute(imageAlt)}" />`,
    `<meta property="og:site_name" content="Upper East Watch Repair" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
    `<meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}" />`,
    ...(robots ? [`<meta name="robots" content="${robots}" />`] : []),
    ...extraHead,
  ].join("\n    ");

  return html.replace("</head>", `    ${routeMetadata}\n  </head>`);
}

async function writeRouteDocuments(routePath, html) {
  const segments = routePath.split("/").filter(Boolean);
  const directoryPath = path.join(publicDir, ...segments);
  const extensionPath = path.join(publicDir, `${segments.join("/")}.html`);

  await mkdir(directoryPath, { recursive: true });
  await writeFile(path.join(directoryPath, "index.html"), html);
  await mkdir(path.dirname(extensionPath), { recursive: true });
  await writeFile(extensionPath, html);
}

const template = await readFile(path.join(publicDir, "index.html"), "utf8");
const guideFiles = (await readdir(guideSourceDir))
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();
const guides = [rolexGuide];

for (const fileName of guideFiles) {
  const source = await readFile(path.join(guideSourceDir, fileName), "utf8");
  const guide = parseGuideFrontmatter(source, fileName);
  if (RETIRED_PATHS.includes(`/guides/${guide.slug}`)) continue;
  guides.push(guide);
}

const publicPages = [
  {
    path: "/",
    title: "Upper East Watch Repair | Trusted Watch Repair on the Upper East Side",
    description:
      "Precision watch repair at 233 East 84th Street, Manhattan. Mechanical and quartz repair, Swiss battery replacement from $15 to $50, crystals, crowns, and bracelets. Start a repair quote online.",
  },
  {
    path: "/services/watch-repair",
    title: "Watch Repair | Upper East Watch Repair",
    description:
      "Expert watch repair on the Upper East Side, quartz through high-end mechanical movements, all brands. Overhauls, crystals, crowns, and water-resistance restoration at 233 East 84th Street.",
  },
  {
    path: "/services/battery-replacement",
    title: "Watch Battery Replacement $15 to $50 | Upper East Watch Repair",
    description:
      "Swiss watch battery replacement from $15 to $50 with water-resistance care at 233 East 84th Street, Manhattan. Most watches done while you wait.",
  },
  {
    path: "/about",
    title: "About, Hours and Directions | Upper East Watch Repair",
    description:
      "A neighborhood watch repair bench at 233 East 84th Street, New York, NY. Open Monday to Friday 9am to 7pm and Sunday 9am to 6pm.",
  },
  {
    path: "/book",
    title: "Book an Appointment | Upper East Watch Repair",
    description:
      "Book a watch repair appointment at 233 East 84th Street, Manhattan, or walk in during shop hours.",
  },
  {
    path: "/repair",
    title: "Start a Watch Repair Quote | Upper East Watch Repair",
    description:
      "Start a watch repair quote online, call the shop, or get directions to 233 East 84th Street on the Upper East Side.",
  },
  {
    path: "/repair/intake",
    title: "Start Repair Quote | Upper East Watch Repair",
    description:
      "Share a few details about your watch to start a repair quote with Upper East Watch Repair.",
  },
];

for (const page of publicPages) {
  const html = renderMetadataDocument(template, {
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    type: "website",
    image: WORKBENCH_IMAGE,
    imageType: "image/webp",
    imageAlt: WORKBENCH_IMAGE_ALT,
  });
  if (page.path === "/") {
    await writeFile(path.join(publicDir, "index.html"), html);
  } else {
    await writeRouteDocuments(page.path, html);
  }
}

for (const retiredPath of RETIRED_PATHS) {
  const target = REDIRECT_TARGET;
  await writeRouteDocuments(
    retiredPath,
    renderMetadataDocument(template, {
      title: "Watch Repair | Upper East Watch Repair",
      description:
        "Upper East Watch Repair specializes in watch repair and battery replacement at 233 East 84th Street, Manhattan.",
      canonicalPath: REDIRECT_TARGET,
      type: "website",
      robots: "noindex, follow",
      extraHead: [`<meta http-equiv="refresh" content="0; url=${escapeAttribute(target)}" />`],
    }),
  );
}

await writeRouteDocuments(
  "/guides",
  renderMetadataDocument(template, {
    title: "Watch Care Guides | Upper East Watch Repair",
    description:
      "Practical guides on watch care, battery life, servicing, and water resistance from the bench at Upper East Watch Repair.",
    canonicalPath: "/guides",
    type: "website",
  }),
);

for (const guide of guides) {
  const canonicalPath = `/guides/${guide.slug}`;
  await writeRouteDocuments(
    canonicalPath,
    renderMetadataDocument(template, {
      title: `${guide.title} | Upper East Watch Repair`,
      description: guide.metaDescription,
      canonicalPath,
      type: "article",
    }),
  );
}

console.info(`Generated route metadata for ${publicPages.length} pages, ${guides.length} guides, ${RETIRED_PATHS.length} redirects.`);