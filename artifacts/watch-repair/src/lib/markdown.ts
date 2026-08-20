export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Approximate reading time in minutes (200 wpm). */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Slugify heading text into a stable anchor id. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Extract h2/h3 headings from markdown for a table of contents. */
export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n');
  const items: TocItem[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      items.push({ id: slugifyHeading(text), text, level });
    }
  }
  return items;
}

interface RenderedBlock {
  key: string;
  html: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Inline formatting: bold, italic, code, links. Input is already HTML-escaped. */
function inline(text: string): string {
  let out = text;
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safeUrl = String(url).replace(/"/g, '&quot;');
    return `<a href="${safeUrl}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

/**
 * Minimal, dependency-free markdown-to-HTML for guide bodies.
 * Supports headings (with anchor ids), paragraphs, unordered/ordered lists,
 * blockquotes, fenced code blocks, horizontal rules, and inline formatting.
 */
export function renderMarkdown(markdown: string): RenderedBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: RenderedBlock[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({
        key: `b${key++}`,
        html: `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`,
      });
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ key: `b${key++}`, html: '<hr />' });
      i++;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugifyHeading(text);
      blocks.push({
        key: `b${key++}`,
        html: `<h${level} id="${id}">${inline(escapeHtml(text))}</h${level}>`,
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        key: `b${key++}`,
        html: `<blockquote>${inline(escapeHtml(quote.join(' ')))}</blockquote>`,
      });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*+]\s+/, '');
        items.push(`<li>${inline(escapeHtml(content))}</li>`);
        i++;
      }
      blocks.push({ key: `b${key++}`, html: `<ul>${items.join('')}</ul>` });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push(`<li>${inline(escapeHtml(content))}</li>`);
        i++;
      }
      blocks.push({ key: `b${key++}`, html: `<ol>${items.join('')}</ol>` });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-blank, non-special lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('```') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({
      key: `b${key++}`,
      html: `<p>${inline(escapeHtml(para.join(' ')))}</p>`,
    });
  }

  return blocks;
}
