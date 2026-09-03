import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { CalendarClock, ChevronRight, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/upper-east-horology/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { PageMeta } from '@/components/PageMeta';
import { Section } from '@/components/Section';
import { ADDRESS_SINGLE_LINE, MAPS_URL } from '@/data/business';

const CAL_LINK = import.meta.env.VITE_CAL_LINK as string | undefined;

/** Inline Cal.com embed loaded via the official embed script. */
function CalEmbed({ calLink }: { calLink: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    // Cal.com embed snippet (inline mode)
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "uew", { origin: "https://cal.com" });
      Cal.ns.uew("inline", {
        elementOrSelector: "#cal-inline-embed",
        calLink: ${JSON.stringify(calLink)},
        layout: "month_view",
      });
      Cal.ns.uew("ui", { hideEventTypeDetails: false, layout: "month_view" });
    `;
    document.body.appendChild(script);

    const t = setTimeout(() => {
      if (!cancelled) setLoaded(true);
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(t);
      script.remove();
    };
  }, [calLink]);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {!loaded && (
        <div className="p-8 space-y-4" data-testid="cal-loading">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      )}
      <div
        id="cal-inline-embed"
        ref={containerRef}
        className="min-h-[600px] w-full"
        data-testid="cal-embed"
      />
    </div>
  );
}

/** Fallback shown when VITE_CAL_LINK is not configured. */
function CalFallback() {
  return (
    <Card data-testid="cal-fallback">
      <CardHeader>
        <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center mb-2">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>Online booking is being set up</CardTitle>
        <CardDescription>
          Our online scheduler isn't connected yet — but you can still reach us to book
          your repair.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>For the shop team</AlertTitle>
          <AlertDescription>
            Set the <code className="text-foreground font-mono text-xs">VITE_CAL_LINK</code>{' '}
            environment variable to your Cal.com link (for example{' '}
            <code className="text-foreground font-mono text-xs">your-shop/watch-repair</code>)
            to enable inline booking on this page.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="block">
            <div className="rounded-md border border-border p-4 hover-elevate h-full">
              <MapPin className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium text-foreground">Walk in</p>
              <p className="text-sm text-muted-foreground mt-1">
                {ADDRESS_SINGLE_LINE}
              </p>
            </div>
          </a>
          <div className="rounded-md border border-border p-4">
            <Phone className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-foreground">Call the shop</p>
            <p className="text-sm text-muted-foreground mt-1">
              Reach us during shop hours to schedule a repair.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookPage() {
  const configured = !!CAL_LINK && CAL_LINK.trim().length > 0;

  return (
    <>
      <PageMeta
        title="Book an Appointment | Upper East Watch Repair"
        description="Book a watch or jewelry repair appointment at Upper East Watch Repair, 233 East 84th Street, Manhattan. Reserve a time online or walk in during shop hours."
      />

      <Section className="pt-12 lg:pt-16">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Book</span>
        </nav>

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Reserve a time
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-[1.05]">
            Book your appointment
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Choose a time that works for you and bring your watch or jewelry in for
            assessment. Prefer to walk in? We're at 233 East 84th Street during shop hours.
          </p>
        </div>

        <div className="mt-10">
          {configured ? <CalEmbed calLink={CAL_LINK!} /> : <CalFallback />}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/repair/intake">
            <Button data-testid="button-book-intake">
              Start repair intake
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/services/watch-repair">
            <Button variant="outline" data-testid="button-book-services">
              Review our services
            </Button>
          </Link>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:underline"
            data-testid="link-book-directions"
          >
            Get directions
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>
        </div>
      </Section>
    </>
  );
}
