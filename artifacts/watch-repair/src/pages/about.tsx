import { Link } from 'wouter';
import { MapPin, Clock, ArrowRight, ChevronRight, Navigation } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Card, CardContent } from '@workspace/upper-east-horology/components/ui/card';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import { PageMeta } from '@/components/PageMeta';
import { Section, SectionHeading } from '@/components/Section';
import { WatchPoster } from '@/components/WatchPoster';
import {
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  HOURS_DISPLAY,
  MAPS_URL,
  POSTAL_CODE,
  STREET_ADDRESS,
} from '@/data/business';

export default function AboutPage() {
  return (
    <>
      <PageMeta
        title="About | Upper East Watch Repair"
        description="The story of Upper East Watch Repair — a trusted neighborhood repair bench at 233 East 84th Street, New York, NY. Hours, location, and directions."
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <WatchPoster className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">About</span>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            Our story
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground leading-[1.05] max-w-3xl">
            A neighborhood bench, built on trust
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Upper East Watch Repair is a working repair bench in the heart of the Upper
            East Side — the kind of shop where the person who greets you is the same
            person who repairs your watch.
          </p>
        </div>
      </section>

      {/* STORY */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <SectionHeading eyebrow="Why we exist" title="Fine work, done locally" />
            <div className="space-y-5 text-muted-foreground leading-relaxed text-base">
              <p>
                For years, neighbors have brought their most valued watches and jewelry
                to our bench at 233 East 84th Street — engagement rings, inherited
                automatics, everyday quartz watches that simply need a fresh battery.
                Every one is treated with the same steady attention.
              </p>
              <p>
                We service quartz and mechanical movements across all major brands,
                from routine battery replacements to full high-end mechanical overhauls.
                On the jewelry side, we resize rings, repair chains, replace diamonds,
                and rebuild worn prongs — precise work that protects the pieces you wear
                every day.
              </p>
              <p>
                What keeps customers coming back is simple: honest quotes before any work
                begins, careful hands at the bench, and the confidence of leaving
                something valuable with people who genuinely care about getting it right.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/book">
                <Button data-testid="button-about-book">
                  Book an Appointment
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Location card */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
                    Visit us
                  </span>
                </div>
                <address className="not-italic text-foreground leading-relaxed mb-4">
                  {STREET_ADDRESS}<br />
                  {ADDRESS_LOCALITY}, {ADDRESS_REGION} {POSTAL_CODE}
                </address>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full" data-testid="button-directions">
                    <Navigation className="h-4 w-4 mr-1.5" />
                    Get Directions
                  </Button>
                </a>

                <Separator className="my-6" />

                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
                    Hours
                  </span>
                </div>
                <ul className="space-y-2">
                  {HOURS_DISPLAY.map((h) => (
                    <li key={h.days} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{h.days}</span>
                      <span className="text-foreground font-medium">{h.hours}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* MAP */}
      <Section className="bg-card border-y border-border pt-0 lg:pt-0">
        <SectionHeading eyebrow="Find the shop" title="On the Upper East Side" />
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 block group rounded-lg overflow-hidden border border-border relative aspect-[21/9]"
          data-testid="link-map"
        >
          <WatchPoster className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 mb-4 transition-transform group-hover:scale-110">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <p className="font-serif text-2xl font-semibold text-foreground">
                {STREET_ADDRESS}
              </p>
              <p className="text-muted-foreground mt-1">
                {ADDRESS_LOCALITY}, {ADDRESS_REGION} {POSTAL_CODE}
              </p>
              <p className="text-sm text-primary mt-3 group-hover:underline">
                Open in Google Maps
              </p>
            </div>
          </div>
        </a>
      </Section>
    </>
  );
}
