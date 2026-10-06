import type { Guide } from '@workspace/api-client-react';
import { SITE_URL, SHARE_IMAGE_URL } from '@/data/business';

export function ArticleJsonLd({ guide }: { guide: Guide }) {
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
      image: guide.ogImage || SHARE_IMAGE_URL,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/guides/${guide.slug}`,
      },
    };

  return <script id="article-jsonld" type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />;
}
