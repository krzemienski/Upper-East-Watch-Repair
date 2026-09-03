import { useEffect } from 'react';
import type { Guide } from '@workspace/api-client-react';

export function ArticleJsonLd({ guide }: { guide: Guide }) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.metaDescription || guide.excerpt,
      author: {
        '@type': 'Organization',
        name: guide.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Upper East Watch Repair',
      },
      datePublished: guide.publishedAt ?? guide.createdAt,
      dateModified: guide.updatedAt,
      ...(guide.ogImage ? { image: guide.ogImage } : {}),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-jsonld';
    script.textContent = JSON.stringify(schema);
    // Remove any prior article schema before adding
    const prev = document.getElementById('article-jsonld');
    if (prev) prev.remove();
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('article-jsonld');
      if (el) el.remove();
    };
  }, [guide]);

  return null;
}
