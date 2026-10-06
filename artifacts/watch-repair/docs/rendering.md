# Public HTML and discovery

The public pages are rendered from the existing React components during the
production build, including their headings, primary text, navigation, metadata,
and JSON-LD. The development preview uses the same renderer per request. This
is not a separate crawler-only version of the site.

`content/site.json` owns the primary domain and retired paths. Runtime business
data, prerendering, the sitemap, robots.txt, and seeded guide images consume it.
The renderer collects metadata from each page's `PageMeta`, rather than keeping
a second list of titles and descriptions.

## Build and publish

The build takes a **read-only snapshot of published guide records** from the
configured database. Drafts and retired guides are never serialized. The same
snapshot primes the browser's guide queries, so an initial article does not
disappear into a loading skeleton when JavaScript starts. The live API refreshes
the guide queries afterward.

The database must be available during the build. A failed query stops the build;
it never silently deploys metadata-only or empty article pages. Build with the
deployment's intended database. The read-only snapshot applies the same exact
retired-recommendation and legacy-image corrections as API startup, because a
static build may run before that startup migration. Changing published articles requires rebuilding
and republishing to update the static HTML and sitemap, even though the live API
can show the updated records sooner.

The generated output includes both route directories and `.html` files. Static
deployment rewrites serve those documents; private/unknown SPA routes fall back
to a separate `noindex` shell instead of the homepage canonical. Retired jewelry
routes serve `noindex` move notices with a watch-repair canonical and immediate
refresh; the development server responds with a 301. They are not sitemap
destinations, and the public API excludes the retired guide even if an editor
marks its historical record published again.

## Checks

After building, run `pnpm --filter @workspace/watch-repair test:prerender`.
The checks inspect response documents without JavaScript, validate schema,
metadata uniqueness, share-image availability, and retired-route handling.
