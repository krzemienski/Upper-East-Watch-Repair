import type { ReactNode } from 'react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { HeroMedia } from '@/components/HeroMedia';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col text-foreground">
      <HeroMedia className="fixed inset-0 -z-10" />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <SiteNav />
        <main className="site-cinematic-content flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
