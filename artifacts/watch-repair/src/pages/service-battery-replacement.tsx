import { Link } from 'wouter';
import { Check, ArrowRight, BatteryCharging, Droplets, Search, Clock } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/upper-east-horology/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/upper-east-horology/components/ui/accordion';
import { PageMeta } from '@/components/PageMeta';
import { ServiceHero } from '@/components/ServiceHero';
import { Section, SectionHeading } from '@/components/Section';
import { AddressLink } from '@/components/ContactLinks';

const steps = [
  {
    icon: Search,
    title: 'Inspection first',
    description:
      'We open the caseback, inspect the movement, and confirm a fresh battery is all your watch needs.',
  },
  {
    icon: BatteryCharging,
    title: 'Genuine Swiss battery',
    description:
      'We fit a quality Swiss battery matched to your movement for reliable, long-lasting performance.',
  },
  {
    icon: Droplets,
    title: 'Water-resistance care',
    description:
      'Gaskets are checked and the case is pressure-tested where applicable to protect against moisture.',
  },
  {
    icon: Clock,
    title: 'Often while you wait',
    description:
      'Most battery replacements are completed on the spot, so you can leave wearing your watch.',
  },
];

const included = [
  'Genuine Swiss battery',
  'Movement inspection included',
  'Gasket check and water-resistance test',
  'Caseback reseal',
  'Most watches completed while you wait',
  'Honest assessment if more service is needed',
];

const faqs = [
  {
    q: 'How much does a battery replacement cost?',
    a: 'Battery replacement ranges from $15 to $50 depending on the complexity of the watch — some cases and movements require more careful handling. We confirm the exact price before we begin.',
  },
  {
    q: 'Do you test water resistance?',
    a: 'Yes. We check the gaskets and pressure-test the case where applicable at no additional charge, so a new battery doesn\'t come at the cost of moisture protection.',
  },
  {
    q: 'Can you do it while I wait?',
    a: 'Most standard battery replacements are completed on the spot. More complex cases may take a little longer, and we\'ll let you know up front.',
  },
  {
    q: 'What if my watch needs more than a battery?',
    a: 'If the movement needs attention beyond a battery, we\'ll show you what we found and give you a clear quote. There\'s never an obligation to proceed.',
  },
];

export default function ServiceBatteryReplacementPage() {
  return (
    <>
      <PageMeta
        title="Battery Replacement | Upper East Watch Repair"
        description="Swiss battery replacement from $15 to $50 with water-resistance testing at 233 East 84th Street. Genuine batteries, movement inspection, and most watches done while you wait."
      />
      <ServiceHero
        path="/services/battery-replacement"
        eyebrow="Battery Replacement"
        title="Swiss batteries, done right"
        description="A fresh battery is the most common watch service — and one we take seriously. Genuine Swiss batteries, water-resistance care, and honest pricing from $15 to $50 depending on watch complexity."
      />

      {/* PRICING BANNER */}
      <Section className="py-10 border-b border-border">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
              Transparent pricing
            </p>
            <p className="font-serif text-4xl font-semibold text-foreground">
              $15 <span className="text-muted-foreground text-2xl">–</span> $50
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Depending on watch complexity. Confirmed before any work begins.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* STEPS */}
      <Section>
        <SectionHeading
          eyebrow="Our process"
          title="More than a swap"
          description="A battery is only right when the seal and movement are right too. Here's what's included every time."
        />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} data-testid={`step-${s.title.slice(0, 8)}`}>
                <CardHeader>
                  <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{s.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{s.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* INCLUDED */}
      <Section className="bg-card border-y border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <SectionHeading
            eyebrow="What's included"
            title="Every battery service, complete"
          />
          <ul className="grid grid-cols-1 gap-3 self-center">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHeading eyebrow="Questions" title="Battery replacement, answered" />
        <div className="mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent forceMount className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-card border-t border-border py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-foreground">
            Stop in for a fresh battery
          </h2>
          <p className="mt-4 text-muted-foreground">
            Walk in during shop hours or book ahead. We're at{' '}
            <AddressLink testId="link-battery-address" />.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/book">
              <Button size="lg" data-testid="button-battery-book">
                Book an Appointment
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/services/watch-repair">
              <Button size="lg" variant="outline" data-testid="button-battery-repair">
                Need a full repair?
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
