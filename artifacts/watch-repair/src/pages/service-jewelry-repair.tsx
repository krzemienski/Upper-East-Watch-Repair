import { Link } from 'wouter';
import { Check, ArrowRight, Gem, Link2, Sparkles, CircleDot } from 'lucide-react';
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

const disciplines = [
  {
    icon: CircleDot,
    title: 'Ring resizing',
    description:
      'Sizing up or down with a seamless join and matched finish — so your ring fits perfectly and looks untouched.',
  },
  {
    icon: Link2,
    title: 'Chain & clasp repair',
    description:
      'Invisible solder repairs for broken links and snapped clasps, plus clasp replacement in matching metals.',
  },
  {
    icon: Gem,
    title: 'Diamond & stone replacement',
    description:
      'Careful sourcing and setting of replacement diamonds and gemstones to restore a piece to its original beauty.',
  },
  {
    icon: Sparkles,
    title: 'Prong repair & retipping',
    description:
      'Rebuilding worn or broken prongs to keep your stones secure — a small fix that prevents a devastating loss.',
  },
];

const included = [
  'Ring resizing — up or down',
  'Chain and bracelet repair',
  'Clasp repair and replacement',
  'Diamond and gemstone replacement',
  'Prong retipping and rebuilding',
  'Rhodium plating for white gold',
  'Soldering and invisible joins',
  'Finish matching and polishing',
];

const faqs = [
  {
    q: 'Can you resize any ring?',
    a: 'We resize most gold and platinum rings, up or down, with a seamless join and a finish matched to the original. Some designs — like eternity bands or tension settings — have limitations we\'ll explain when you bring the ring in.',
  },
  {
    q: 'Will a repaired chain be visible?',
    a: 'Our solder repairs are designed to be invisible. Once polished, a repaired link or clasp blends into the original piece with no visible seam.',
  },
  {
    q: 'Do you replace lost diamonds and stones?',
    a: 'Yes. We source replacement diamonds and gemstones matched to your piece and set them securely. We\'ll walk you through the options and pricing before proceeding.',
  },
  {
    q: 'My ring\'s prongs look worn — is that urgent?',
    a: 'Worn prongs are the most common cause of lost stones, so it\'s worth addressing early. Retipping or rebuilding prongs is a straightforward repair that protects your investment.',
  },
];

export default function ServiceJewelryRepairPage() {
  return (
    <>
      <PageMeta
        title="Jewelry Repair | Upper East Watch Repair"
        description="Fine jewelry repair on the Upper East Side — ring resizing, chain repair, diamond replacement, and prong repair at 233 East 84th Street. Precise, invisible work you can trust."
      />
      <ServiceHero
        eyebrow="Jewelry Repair"
        title="The same precision, applied to fine jewelry"
        description="Rings, chains, and settings deserve the same steady hands as a fine watch. Resizing, invisible repairs, stone replacement, and prong work — done with care."
      />

      {/* DISCIPLINES */}
      <Section>
        <SectionHeading
          eyebrow="What we repair"
          title="Fine jewelry, restored"
          description="From a loose prong to a full resize, every piece is treated as if it were our own."
        />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {disciplines.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.title} data-testid={`discipline-${d.title.slice(0, 8)}`}>
                <CardHeader>
                  <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{d.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{d.description}</CardDescription>
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
            eyebrow="Services offered"
            title="A full jewelry bench"
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
        <SectionHeading eyebrow="Questions" title="Jewelry repair, answered" />
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
            Bring in your jewelry
          </h2>
          <p className="mt-4 text-muted-foreground">
            Book a consultation or stop by the shop at 233 East 84th Street.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/book">
              <Button size="lg" data-testid="button-jewelry-book">
                Book an Appointment
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/services/watch-repair">
              <Button size="lg" variant="outline" data-testid="button-jewelry-watch">
                Explore watch repair
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
