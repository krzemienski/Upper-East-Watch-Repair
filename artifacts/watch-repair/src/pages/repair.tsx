import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent } from '@workspace/upper-east-horology/components/ui/card';
import { PageMeta } from '@/components/PageMeta';
import { Section, SectionHeading } from '@/components/Section';
import { ADDRESS_SINGLE_LINE, MAPS_URL, TEL_URL } from '@/data/business';
import { AddressLink } from '@/components/ContactLinks';
import {
  getRepairVariant,
  selectRepairCta,
  trackFunnelEvent,
  type FunnelVariant,
} from '@/lib/repair-funnel';

export default function RepairPage() {
  const [variant] = useState<FunnelVariant>(() => getRepairVariant());

  useEffect(() => {
    trackFunnelEvent('repair_landing_viewed', { variant });
  }, [variant]);

  const headline =
    variant === 'consultation'
      ? 'Tell us what your watch needs.'
      : 'A stopped watch deserves a precise diagnosis.';
  const subhead =
    variant === 'consultation'
      ? 'Start with a few details. Our repair team will review your watch and contact you about the right next step.'
      : 'From batteries to complete mechanical service, get your repair in front of an experienced Upper East Side watchmaker.';

  return (
    <>
      <PageMeta
        title="Start a Watch Repair | Upper East Watch Repair"
        description="Start a watch repair quote online, call our Upper East Side shop, or visit us at 233 East 84th Street."
      />
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_80%_20%,hsl(var(--primary)/.22),transparent_38%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6">
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
              Online repair intake
            </Badge>
            <h1 className="font-serif text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.03]">
              {headline}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              {subhead}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/repair/intake" onClick={() => selectRepairCta('online_intake')} data-testid="repair-start-intake">
                  Start repair quote <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              {TEL_URL && (
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <a href={TEL_URL} onClick={() => selectRepairCta('call')} data-testid="repair-call-shop">
                    <Phone className="h-4 w-4 mr-1.5" /> Call the shop
                  </a>
                </Button>
              )}
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" onClick={() => selectRepairCta('directions')} data-testid="repair-directions">
                  <MapPin className="h-4 w-4 mr-1.5" /> Directions
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No obligation. Submitting details does not mean we have received your watch.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="A clearer first step"
          title="A thoughtful assessment starts before the bench"
          description="Share what you know. A brand and a short description of the problem are all we need to begin."
        />
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            [Clock3, 'Takes about 3 minutes', 'Tell us the symptoms, urgency, and best way to reach you.'],
            [ShieldCheck, 'Private by default', 'Your contact details are used only to handle your request.'],
            [CheckCircle2, 'Clear next steps', 'You receive a reference number and our team follows up before any work begins.'],
          ].map(([Icon, title, copy]) => (
            <Card key={String(title)}>
              <CardContent className="pt-6">
                <Icon className="h-6 w-6 text-primary mb-4" />
                <h2 className="font-semibold">{String(title)}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{String(copy)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-card border-y border-border">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">Visit the workshop</p>
            <h2 className="font-serif text-3xl font-semibold mt-2">Prefer to speak in person?</h2>
            <p className="text-muted-foreground mt-3">
              Walk in at <AddressLink testId="link-repair-address">{ADDRESS_SINGLE_LINE}</AddressLink>. We will inspect your watch and provide a quote before work begins.
            </p>
          </div>
          <Button size="lg" variant="outline" asChild>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" onClick={() => selectRepairCta('directions_footer')} data-testid="repair-directions-footer">
              <MapPin className="h-4 w-4 mr-2" /> Get directions
            </a>
          </Button>
        </div>
      </Section>
    </>
  );
}