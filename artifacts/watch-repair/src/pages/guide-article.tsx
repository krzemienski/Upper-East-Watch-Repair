import { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Clock, AlertCircle, ListTree } from 'lucide-react';
import { PublicBreadcrumb } from '@/components/PublicBreadcrumb';
import {
  useGetPublishedGuide,
  getGetPublishedGuideQueryKey,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Skeleton } from '@workspace/upper-east-horology/components/ui/skeleton';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@workspace/upper-east-horology/components/ui/empty';
import { PageMeta } from '@/components/PageMeta';
import { ArticleJsonLd } from '@/components/ArticleJsonLd';
import { AdSlot } from '@/components/AdSlot';
import { Section } from '@/components/Section';
import { SITE_URL, SHARE_IMAGE_URL } from '@/data/business';
import { renderMarkdown, extractToc, readingTime } from '@/lib/markdown';

export default function GuideArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';

  const { data: guide, isLoading, isError } = useGetPublishedGuide(slug, {
    query: {
      enabled: !!slug,
      queryKey: getGetPublishedGuideQueryKey(slug),
    },
  });

  const blocks = useMemo(
    () => (guide ? renderMarkdown(guide.body) : []),
    [guide]
  );
  const toc = useMemo(() => (guide ? extractToc(guide.body) : []), [guide]);

  if (isLoading) {
    return (
      <Section className="pt-12">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-4 w-40 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (isError || !guide) {
    return (
      <Section className="pt-12">
        <div className="max-w-2xl mx-auto">
          <Empty className="border border-border rounded-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Guide not found</EmptyTitle>
              <EmptyDescription>
                This guide may have been unpublished or the link is incorrect.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/guides">
                <Button data-testid="button-back-guides">Back to all guides</Button>
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      </Section>
    );
  }

  const minutes = readingTime(guide.body);

  return (
    <>
      <PageMeta
        title={`${guide.title} | Upper East Watch Repair`}
        description={guide.metaDescription || guide.excerpt}
        canonical={`${SITE_URL}/guides/${guide.slug}`}
        image={guide.ogImage || SHARE_IMAGE_URL}
      />
      <ArticleJsonLd guide={guide} />

      <Section className="pt-12 lg:pt-16">
        <PublicBreadcrumb className="mb-8" items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
          {/* Article */}
          <article className="max-w-3xl min-w-0">
            <header className="mb-8">
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-[1.08]">
                {guide.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                {guide.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{guide.author}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {minutes} min read
                </span>
                {guide.publishedAt && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={guide.publishedAt}>
                      {new Date(guide.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </>
                )}
              </div>
            </header>

            <Separator className="mb-8" />

            {/* Top ad slot */}
            <AdSlot slot="article-top" />

            <div
              className="prose prose-watch max-w-none prose-headings:font-serif prose-headings:scroll-mt-24 prose-a:font-medium prose-pre:bg-muted prose-pre:text-foreground"
              data-testid="guide-body"
            >
              {blocks.map((b) => (
                <div key={b.key} dangerouslySetInnerHTML={{ __html: b.html }} />
              ))}
            </div>

            {/* Bottom ad slot */}
            <AdSlot slot="article-bottom" />

            <Separator className="my-10" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href="/guides">
                <Button variant="outline" data-testid="button-all-guides">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All guides
                </Button>
              </Link>
              <Link href="/book">
                <Button data-testid="button-guide-book">Book a repair</Button>
              </Link>
            </div>
          </article>

          {/* Table of contents */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70">
                  <ListTree className="h-3.5 w-3.5 text-primary" />
                  On this page
                </div>
                <nav aria-label="Table of contents">
                  <ul className="space-y-2 border-l border-border">
                    {toc.map((item) => (
                      <li key={item.id} style={{ paddingLeft: item.level === 3 ? 24 : 12 }}>
                        <a
                          href={`#${item.id}`}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors -ml-px border-l border-transparent hover:border-primary pl-3"
                          data-testid={`toc-${item.id}`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>
      </Section>
    </>
  );
}
