import { type ReactNode } from 'react';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { BUSINESS_PHONE, MAPS_URL, STREET_ADDRESS, TEL_URL } from '@/data/business';

/** Inline street address that opens the shop in Google Maps. */
export function AddressLink({
  children = STREET_ADDRESS,
  className,
  testId = 'link-address',
}: {
  children?: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <a
      href={MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary transition-colors', className)}
      data-testid={testId}
    >
      {children}
    </a>
  );
}

/** Inline phone number as a tel: link. Renders nothing when no public phone is configured. */
export function PhoneLink({ className, testId = 'link-phone' }: { className?: string; testId?: string }) {
  if (!TEL_URL) return null;
  return (
    <a href={TEL_URL} className={cn('hover:text-primary transition-colors', className)} data-testid={testId}>
      {BUSINESS_PHONE}
    </a>
  );
}
