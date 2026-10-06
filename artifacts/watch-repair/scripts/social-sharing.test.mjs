import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import site from '../../../content/site.json' with { type: 'json' };

const root = path.resolve(import.meta.dirname, "..");
const siteUrl = site.siteUrl;
const workbench = `${siteUrl}/media/upper-east-watch-repair-workbench-og.webp`;
const guideImage = `${siteUrl}/og/upper-east-watch-repair-share.png`;

function meta(html, attribute, key) {
  const tags = [...html.matchAll(new RegExp(`<meta ${attribute}="${key}" content="([^"]+)"[^>]*>`, "g"))];
  assert.equal(tags.length, 1, `Expected exactly one ${key}`);
  return tags[0][1];
}

function checkPreview(html, image) {
  assert.equal(meta(html, "property", "og:image"), image);
  assert.equal(meta(html, "name", "twitter:image"), image);
  assert.equal(meta(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(meta(html, "property", "og:image:width"), "1200");
  assert.equal(meta(html, "property", "og:image:height"), "630");
}

test("initial HTML declares the marketing preview without JavaScript", async () => {
  checkPreview(await readFile(path.join(root, "index.html"), "utf8"), workbench);
  const bytes = await readFile(path.join(root, "public/media/upper-east-watch-repair-workbench-og.webp"));
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
});

test("built marketing documents have workbench previews; guides retain their previews", async () => {
  for (const route of ["", "about", "services/watch-repair", "services/battery-replacement", "book", "repair", "repair/intake"]) {
    const html = await readFile(path.join(root, "dist/public", route, "index.html"), "utf8");
    checkPreview(html, workbench);
    assert.equal(meta(html, "property", "og:image:type"), "image/webp");
  }
  const guidesDir = path.join(root, "dist/public/guides");
  checkPreview(await readFile(path.join(guidesDir, "index.html"), "utf8"), guideImage);
  for (const entry of await readdir(guidesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const html = await readFile(path.join(guidesDir, entry.name, "index.html"), "utf8");
      const snapshot = html.match(/<script id="published-guide-snapshot" type="application\/json">([^<]+)<\/script>/);
      const guide = snapshot ? JSON.parse(snapshot[1])[0] : null;
      checkPreview(html, new URL(guide?.ogImage || guideImage, siteUrl).href);
    }
  }
});

test("PageMeta defaults, overrides, and restores social metadata on navigation", async () => {
  const elements = [];
  const document = {
    head: { appendChild: (element) => elements.push(element) },
    createElement: () => ({
      setAttribute(name, value) { this[name] = value; },
    }),
    querySelector(selector) {
      const [, attribute, value] = selector.match(/\[([^=]+)="([^"]+)"\]/);
      return elements.find((element) => element[attribute] === value) ?? null;
    },
  };
  const source = await readFile(path.join(root, "src/components/PageMeta.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, document, URL,
    window: { location: { pathname: "/about" } },
    require(name) {
      if (name === "react") return {
        useEffect: (effect) => effect(),
        createContext: () => ({}),
        useContext: () => null,
      };
      if (name === "@/data/business") return { SITE_URL: siteUrl, WORKBENCH_OG_IMAGE_URL: workbench };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const props = { title: "About", description: "Shop information" };
  const check = (image) => {
    assert.equal(document.querySelector('meta[property="og:image"]').content, image);
    assert.equal(document.querySelector('meta[name="twitter:image"]').content, image);
    assert.equal(document.querySelector('meta[name="twitter:card"]').content, "summary_large_image");
  };
  exports.PageMeta(props);
  check(workbench);
  exports.PageMeta({ ...props, image: guideImage });
  check(guideImage);
  exports.PageMeta({ ...props, image: "/media/custom.webp" });
  check(`${siteUrl}/media/custom.webp`);
  exports.PageMeta(props);
  check(workbench);
  exports.PageMeta({ ...props, image: "" });
  check(workbench);
  assert.equal(elements.filter((element) => element.property === "og:image").length, 1);
});
