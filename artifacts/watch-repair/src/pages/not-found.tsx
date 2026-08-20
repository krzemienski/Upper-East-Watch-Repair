import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { WatchPoster } from '@/components/WatchPoster';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page Not Found | Upper East Watch Repair"
        description="The page you were looking for could not be found."
      />
      <section className="relative flex-1 flex items-center justify-center min-h-[70vh] overflow-hidden">
        <WatchPoster className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative z-10 text-center px-4 max-w-lg">
          <Logo className="h-10 w-auto mx-auto mb-8" />
          <p className="font-serif text-7xl sm:text-8xl font-semibold text-primary">404</p>
          <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-foreground">
            This page has stopped ticking
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The page you were looking for isn't here. Let's get you back on track —
            or bring your watch to the bench.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/">
              <Button data-testid="button-home">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back home
              </Button>
            </Link>
            <Link href="/services/watch-repair">
              <Button variant="outline" data-testid="button-explore">
                <Compass className="h-4 w-4 mr-1.5" />
                Explore services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
