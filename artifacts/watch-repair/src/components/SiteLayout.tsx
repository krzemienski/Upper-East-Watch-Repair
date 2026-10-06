import { useState, type ReactNode } from 'react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { usePrefersReducedMotion } from '@/hooks/use-media-preference';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { HeroMedia } from '@/components/HeroMedia';

export function SiteLayout({ children }: { children: ReactNode }) {
  const [motionPaused, setMotionPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col text-foreground">
      <HeroMedia className="fixed inset-0 -z-10" paused={motionPaused} />
      {!reducedMotion && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-background"
            aria-pressed={motionPaused}
            onClick={() => setMotionPaused((paused) => !paused)}
          >
            {motionPaused ? 'Resume background motion' : 'Pause background motion'}
          </Button>
        </div>
      )}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <SiteNav />
        <main className="site-cinematic-content flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
