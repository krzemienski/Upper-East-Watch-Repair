import { Link } from 'wouter';
import {
  Clock,
  ShieldCheck,
  MapPin,
  BatteryCharging,
  Watch,
  ArrowRight,
  Quote,
} from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/upper-east-horology/components/ui/card';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { PageMeta } from '@/components/PageMeta';
import { WatchPoster } from '@/components/WatchPoster';
import { Section, SectionHeading } from '@/components/Section';
import { services } from '@/data/services';
import { testimonials } from '@/data/testimonials';
import { MAPS_URL, TEL_URL } from '@/data/business';
import { AddressLink } from '@/components/ContactLinks';

const serviceIcons = [Watch, BatteryCharging];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Every brand, every movement',
    description:
      'Quartz to complicated mechanical calibers — Swiss, Japanese, and vintage — handled at a single trusted bench.',
  },
  {
    icon: Clock,
    title: 'Honest timelines and pricing',
    description:
      'You get a clear quote before any work begins. Most repairs are completed quickly, many while you wait.',
  },
  {
    icon: MapPin,
    title: 'A real neighborhood shop',
    description:
      'On the Upper East Side at 233 East 84th Street. Walk in, meet the watchmaker, and leave your timepiece in trusted hands.',
  },
];

export default function HomePage() {
  const featured = testimonials.slice(0, 3);

  return (
    <>
      <PageMeta
        title="Upper East Watch Repair | Trusted Watch Repair on the Upper East Side"
        description="Precision watch repair at 233 East 84th Street, Manhattan. Mechanical and quartz repair, Swiss battery replacement from $15 to $50, and crystal, crown, and bracelet work — all brands."
      />

      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center border-b border-border">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-2xl">
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex mb-6" data-testid="badge-location">
              <Badge variant="outline" className="backdrop-blur-sm hover:border-primary transition-colors">
                <MapPin className="h-3 w-3 mr-1.5" />
                233 East 84th Street, Manhattan
              </Badge>
            </a>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.02] tracking-tight">
              Precision for the pieces you never take off.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              A trusted Upper East Side repair bench for fine watches. Mechanical
              overhauls, Swiss batteries, crystals, and bracelets — done with the care
              your timepiece deserves.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/repair/intake" data-testid="button-hero-book">
                  Start repair quote
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Link href="/services/watch-repair">
                <Button size="lg" variant="outline" className="backdrop-blur-sm" data-testid="button-hero-services">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <Section className="py-14 lg:py-16 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="flex gap-4" data-testid={`trust-${point.title.slice(0, 8)}`}>
                <div className="shrink-0 h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{point.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* SERVICES */}
      <Section>
        <SectionHeading
          eyebrow="What we do"
          title="Bench work, done properly"
          description="Two disciplines, one standard of care. Choose the service that brings you in — or ask us in person."
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, idx) => {
            const Icon = serviceIcons[idx];
            return (
              <Card
                key={service.href}
                className="flex flex-col hover-elevate transition-transform"
                data-testid={`card-service-${idx}`}
              >
                <CardHeader>
                  <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-2xl">{service.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link href={service.href}>
                    <Button variant="ghost" className="px-0 hover:px-2 transition-all" data-testid={`link-service-${idx}`}>
                      {service.ctaLabel}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* PROCESS */}
      <Section className="bg-card border-y border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              eyebrow="How it works"
              title="Three steps to a watch that runs like new"
            />
            <ol className="mt-8 space-y-6">
              {[
                {
                  n: '01',
                  t: 'Bring it in or book ahead',
                  d: 'Stop by the shop or reserve a time online. We inspect your piece and talk through what it needs.',
                },
                {
                  n: '02',
                  t: 'Clear quote, no surprises',
                  d: 'You approve a transparent estimate before any work begins. No upsell, no guesswork.',
                },
                {
                  n: '03',
                  t: 'Precision repair, tested and returned',
                  d: 'Your watch is serviced, regulated, and pressure-tested where applicable — then returned running to spec.',
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-5">
                  <span className="font-serif text-2xl text-primary font-semibold shrink-0 w-10">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Link href="/repair/intake">
                <Button data-testid="button-process-book">
                  Tell us about your watch
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature card */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3]">
              <div className="absolute inset-0">
                {/* Reuse abstract poster motif for a warm, cinematic visual */}
                <div className="w-full h-full">
                  <div className="w-full h-full">
                    <HeroFacePanel />
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                On the bench today
              </p>
              <p className="text-foreground leading-relaxed">
                From a stopped vintage automatic to a worn watch bracelet — every
                job gets the same steady hands and full attention.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section>
        <SectionHeading
          eyebrow="From the neighborhood"
          title="Trusted with pieces that matter"
          description="A few words from customers who left their most valued watches in our care."
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((t) => (
            <Card key={t.name} className="flex flex-col" data-testid={`testimonial-${t.name.split(' ')[0]}`}>
              <CardContent className="pt-6 flex flex-col flex-1">
                <Quote className="h-6 w-6 text-primary/40 mb-4" />
                <p className="text-foreground leading-relaxed flex-1">"{t.text}"</p>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <Badge variant="secondary">{t.service}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/about">
            <Button variant="outline" data-testid="button-more-story">
              Read the shop's story
            </Button>
          </Link>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-card border-t border-border">
        <div className="rounded-lg border border-border bg-background overflow-hidden relative">
          <div className="relative z-10 px-6 py-14 sm:px-12 sm:py-16 text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Bring in your watch today
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Walk in during shop hours, or book a time that works for you. We're at{' '}
              <AddressLink testId="link-cta-address" />, ready when you are.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/repair/intake" data-testid="button-cta-book">
                  Start repair quote
                </Link>
              </Button>
              {TEL_URL && (
                <Button size="lg" variant="outline" asChild>
                  <a href={TEL_URL} data-testid="button-cta-call">Call the shop</a>
                </Button>
              )}
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" data-testid="button-cta-directions">
                  Get Directions
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/** Small decorative watch-face panel built from the poster motif. */
function HeroFacePanel() {
  return (
    <div className="relative w-full h-full bg-background">
      <WatchPoster className="absolute inset-0 w-full h-full" />
    </div>
  );
}
