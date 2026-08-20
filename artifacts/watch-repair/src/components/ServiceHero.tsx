import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { WatchPoster } from '@/components/WatchPoster';

interface ServiceHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ServiceHero({ eyebrow, title, description }: ServiceHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <WatchPoster className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Services</span>
        </nav>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground leading-[1.05] max-w-3xl">
          {title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book">
            <Button size="lg" data-testid="button-service-book">
              Book an Appointment
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline" data-testid="button-service-visit">
              Visit the Shop
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
