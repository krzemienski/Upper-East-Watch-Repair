import { Fragment } from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { SITE_URL } from '@/data/business';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function BreadcrumbListJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
  return <script id="breadcrumb-jsonld" type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />;
}

/** One hierarchy supplies both the visible trail and server-rendered schema. */
export function PublicBreadcrumb({ items, className }: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) {
  return (
    <>
      <BreadcrumbListJsonLd items={items} />
      <nav className={cn('flex items-center gap-1.5 text-sm text-muted-foreground mb-6', className)} aria-label="Breadcrumb">
        {items.map((item, index) => (
          <Fragment key={item.path}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            {index === items.length - 1 ? (
              <span className="text-foreground truncate max-w-[50vw]" aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:text-foreground transition-colors"
                data-testid={item.path === '/' ? 'breadcrumb-home' : item.path === '/guides' ? 'breadcrumb-guides' : undefined}>
                {item.name}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
    </>
  );
}
