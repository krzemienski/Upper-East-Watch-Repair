import { Link } from 'wouter';
import { MapPin, Clock } from 'lucide-react';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import { Logo } from '@/components/Logo';
import {
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  ADDRESS_SINGLE_LINE,
  HOURS_DISPLAY,
  MAPS_URL,
  POSTAL_CODE,
  STREET_ADDRESS,
} from '@/data/business';

export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Logo className="h-9 w-auto" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A trusted repair bench serving the Upper East Side since the early 2000s.
              Precision work, honest pricing, every time.
            </p>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
                Hours
              </span>
            </div>
            <ul className="space-y-2">
              {HOURS_DISPLAY.map((h) => (
                <li key={h.days} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{h.days}</span>
                  <span className="text-foreground font-medium">{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Links */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
                Location
              </span>
            </div>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed mb-4">
              {STREET_ADDRESS}<br />
              {ADDRESS_LOCALITY}, {ADDRESS_REGION} {POSTAL_CODE}
            </address>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
              data-testid="link-google-maps"
            >
              Get directions
            </a>

            <div className="mt-6 flex flex-col gap-1.5">
              {[
                { href: '/services/watch-repair', label: 'Watch Repair' },
                { href: '/services/battery-replacement', label: 'Battery Replacement' },
                { href: '/services/jewelry-repair', label: 'Jewelry Repair' },
                { href: '/guides', label: 'Watch Care Guides' },
                { href: '/about', label: 'About the Shop' },
                { href: '/book', label: 'Book Appointment' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Upper East Watch Repair. All rights reserved.</p>
          <p>{ADDRESS_SINGLE_LINE}</p>
        </div>
      </div>
    </footer>
  );
}
