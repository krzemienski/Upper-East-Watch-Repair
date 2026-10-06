import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const intake = read('../src/pages/repair-intake.tsx');
const media = read('../src/components/HeroMedia.tsx');
const layout = read('../src/components/SiteLayout.tsx');
const tokens = JSON.parse(read('../../upper-east-horology/tokens.json'));

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test('shared field borders meet 3:1 against supported surfaces in both token sets', () => {
  for (const mode of ['light', 'dark']) {
    const colors = tokens.color[mode];
    const border = luminance(colors.input.$value);
    for (const surface of ['background', 'card', 'popover', 'secondary', 'muted', 'sidebar', 'sidebarAccent']) {
      const background = luminance(colors[surface].$value);
      const contrast = (Math.max(border, background) + 0.05) / (Math.min(border, background) + 0.05);
      assert.ok(contrast >= 3, `${mode}/${surface}: ${contrast.toFixed(2)}:1`);
    }
  }
  for (const component of ['input', 'textarea']) {
    assert.match(read(`../../upper-east-horology/src/components/ui/${component}.tsx`), /border-input/);
  }
});

test('every intake Field has an explicit matching control and persistent label', () => {
  const fields = [...intake.matchAll(/<Field label="([^"]+)" htmlFor="([^"]+)">([\s\S]*?)<\/Field>/g)];
  assert.equal(fields.length, [...intake.matchAll(/<Field\b/g)].length);
  assert.ok(fields.length > 0);
  const ids = new Set();
  for (const [, label, id, contents] of fields) {
    assert.ok(!ids.has(id), `Duplicate field ID: ${id}`);
    ids.add(id);
    assert.match(contents, new RegExp(`<(?:Input|Textarea|SelectTrigger)\\b[^>]*\\bid="${id}"`), label);
    if (contents.includes('<SelectTrigger')) {
      assert.ok(contents.includes(`aria-labelledby="${id}-label"`), label);
    }
  }
  assert.match(intake, /<Label id=\{`\$\{htmlFor\}-label`\} htmlFor=\{htmlFor\}/);
  assert.match(intake, /function Field\([\s\S]*?htmlFor: string/);
});

test('viewport allows enlargement without a restrictive scale', () => {
  const html = read('../index.html');
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1.0"/);
  assert.doesNotMatch(html, /maximum-scale|user-scalable/);
});

test('public section and guide titles use native H2 rather than global CardTitle changes', () => {
  assert.match(intake, /<h2[^>]*>\{title\}<\/h2>/);
  assert.match(read('../src/pages/guides-index.tsx'), /<h2[^>]*>\s*\{guide.title\}\s*<\/h2>/);
  assert.match(read('../../upper-east-horology/src/components/ui/card.tsx'), /const CardTitle[\s\S]*?<div/);
});

test('persistent keyboard button stops the decorative media and guards asynchronous transitions', () => {
  assert.match(layout, /<Button[\s\S]*?type="button"[\s\S]*?aria-pressed=\{motionPaused\}/);
  assert.match(layout, /Pause background motion/);
  assert.match(layout, /Resume background motion/);
  assert.match(layout, /<HeroMedia[^>]*paused=\{motionPaused\}/);
  assert.match(media, /const motionStopped = paused \|\| reducedMotion/);
  assert.match(media, /\{motionStopped \? \(\s*<img/);
  assert.match(media, /if \(motionStopped \|\| failed.size[\s\S]*?clearTimeout[\s\S]*?setTransitioning\(false\)/);
  assert.match(media, /upcoming.play\(\).then\(\(\) => \{\s*if \(motionStoppedRef.current \|\| !visibleRef.current\)/);
  assert.match(media, /videoRefs.current.get\(index\)\?\.pause\(\)/);
});
