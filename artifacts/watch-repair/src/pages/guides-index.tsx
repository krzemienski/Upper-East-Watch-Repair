import { Link } from 'wouter';
import { ChevronRight, ArrowRight, BookOpen, AlertCircle, Clock } from 'lucide-react';
import {
  useListPublishedGuides,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/upper-east-horology/components/ui/card';
import { Skeleton } from '@workspace/upper-east-horology/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@workspace/upper-east-horology/components/ui/empty';
import { PageMeta } from '@/components/PageMeta';
import { Section } from '@/components/Section';
import { readingTime } from '@/lib/markdown';

function GuideCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
    </Card>
  );
}

export default function GuidesIndexPage() {
  const { data: guides, isLoading, isError, refetch } = useListPublishedGuides();

  return (
    <>
      <PageMeta
        title="Watch Care Guides | Upper East Watch Repair"
        description="Practical guides on watch care, battery life, water resistance, and jewelry maintenance from the bench at Upper East Watch Repair."
      />

      <Section className="pt-12 lg:pt-16 pb-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Guides</span>
        </nav>

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            From the bench
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-[1.05]">
            Watch &amp; jewelry care guides
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Practical, honest advice on keeping your timepieces and jewelry in the best
            possible condition — straight from the people at the bench.
          </p>
        </div>
      </Section>

      <Section className="pt-0">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GuideCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <Empty className="border border-border rounded-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>We couldn't load the guides</EmptyTitle>
              <EmptyDescription>
                Something went wrong reaching our library. Please try again.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => refetch()} data-testid="button-retry-guides">
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && !isError && guides && guides.length === 0 && (
          <Empty className="border border-border rounded-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No guides published yet</EmptyTitle>
              <EmptyDescription>
                We're preparing our first care guides. In the meantime, bring your
                questions to the shop — we're happy to help.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/book">
                <Button data-testid="button-empty-book">Book an appointment</Button>
              </Link>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && !isError && guides && guides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="block h-full"
                data-testid={`link-guide-${guide.slug}`}
              >
                <Card className="flex flex-col h-full hover-elevate">
                  <CardHeader className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{readingTime(guide.body)} min read</span>
                      <span aria-hidden>·</span>
                      <span>{guide.author}</span>
                    </div>
                    <CardTitle className="font-serif text-xl leading-snug">
                      {guide.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed line-clamp-3">
                      {guide.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center text-sm font-medium text-primary">
                      Read guide
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
