import { Link } from 'wouter';
import { Check, ArrowRight, Gauge, Wrench, Droplets, Cog } from 'lucide-react';
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

const capabilities = [
  {
    icon: Cog,
    title: 'Mechanical movements',
    description:
      'Full disassembly, cleaning, lubrication, and reassembly of manual and automatic calibers — from everyday automatics to high complications.',
  },
  {
    icon: Gauge,
    title: 'Quartz service',
    description:
      'Movement diagnosis, coil and circuit checks, and precise regulation so your quartz watch keeps accurate time.',
  },
  {
    icon: Wrench,
    title: 'Crown, stem & crystal',
    description:
      'Replacement crowns and stems, sapphire and mineral crystal fitting, and case and bracelet refinishing.',
  },
  {
    icon: Droplets,
    title: 'Water-resistance restoration',
    description:
      'New gaskets and pressure testing to restore your watch\'s original water resistance rating.',
  },
];

const included = [
  'Quartz through high-end mechanical movement repair',
  'All major brands — Swiss, Japanese, and vintage',
  'Complete overhaul: clean, oil, and regulate',
  'Crystal replacement (sapphire and mineral)',
  'Crown, stem, and pusher repair',
  'Gasket replacement and water-resistance testing',
  'Case, caseback, and bracelet refinishing',
  'Timing adjustment across positions',
];

const faqs = [
  {
    q: 'Do you repair every brand?',
    a: 'Yes. We service quartz and mechanical watches from all major brands, including vintage pieces. Bring your watch in and we\'ll assess exactly what it needs.',
  },
  {
    q: 'How long does a full service take?',
    a: 'A complete mechanical overhaul typically takes one to three weeks depending on parts and complexity. Simpler repairs are often finished within a few days, and many small jobs while you wait.',
  },
  {
    q: 'Will I get a quote before work begins?',
    a: 'Always. We inspect your watch, explain what it needs, and give you a clear written estimate before any work starts. Nothing proceeds without your approval.',
  },
  {
    q: 'Do you service high-end and complicated watches?',
    a: 'We do. From automatics to complicated calibers, high-end mechanical movements receive full disassembly, ultrasonic cleaning, correct lubrication, and multi-position timing.',
  },
];

export default function ServiceWatchRepairPage() {
  return (
    <>
      <PageMeta
        title="Watch Repair | Upper East Watch Repair"
        description="Expert watch repair on the Upper East Side — quartz through high-end mechanical movements, all brands. Overhauls, crystals, crowns, and water-resistance restoration at 233 East 84th Street."
      />
      <ServiceHero
        eyebrow="Watch Repair"
        title="From quartz to high complications"
        description="Whether it's a daily quartz watch or a treasured mechanical piece, every movement is serviced at our bench with precision and patience — all brands welcome."
      />

      {/* CAPABILITIES */}
      <Section>
        <SectionHeading
          eyebrow="Our capabilities"
          title="Complete movement care"
          description="Every repair is diagnosed, quoted, and completed to manufacturer specification."
        />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} data-testid={`capability-${c.title.slice(0, 8)}`}>
                <CardHeader>
                  <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{c.description}</CardDescription>
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
            eyebrow="What's covered"
            title="Everything your watch needs, under one roof"
            description="A single trusted bench for the full range of watch repair — no sending your piece across the country."
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 self-center">
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
        <SectionHeading eyebrow="Questions" title="Watch repair, answered" />
        <div className="mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
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
            Ready to get your watch running?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Book a time or walk in during shop hours at 233 East 84th Street.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/book">
              <Button size="lg" data-testid="button-watch-book">
                Book an Appointment
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/services/battery-replacement">
              <Button size="lg" variant="outline" data-testid="button-watch-battery">
                Need a battery instead?
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
