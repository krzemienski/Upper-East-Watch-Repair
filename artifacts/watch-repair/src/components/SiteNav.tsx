import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { Logo } from '@/components/Logo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/repair', label: 'Start a Repair' },
  { href: '/services/watch-repair', label: 'Watch Repair' },
  { href: '/services/battery-replacement', label: 'Battery' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
];

export function SiteNav() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center" data-testid="link-home-logo">
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = link.href === '/'
              ? location === '/'
              : location.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  )}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" asChild>
            <Link href="/repair/intake" data-testid="nav-book-appointment">
              Start repair quote
            </Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <ul className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = link.href === '/'
                ? location === '/'
                : location.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    )}
                    data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="pt-2">
              <Button className="w-full" asChild>
                <Link href="/repair/intake" onClick={() => setMobileOpen(false)} data-testid="mobile-nav-book">
                  Start repair quote
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
