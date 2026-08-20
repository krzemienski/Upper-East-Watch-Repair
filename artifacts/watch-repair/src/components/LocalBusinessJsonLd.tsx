import { useEffect } from 'react';
import {
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  BUSINESS_NAME,
  OPENING_HOURS,
  OPENING_HOURS_SPEC,
  POSTAL_CODE,
  STREET_ADDRESS,
} from '@/data/business';

export function LocalBusinessJsonLd() {
  useEffect(() => {
    const existing = document.getElementById('local-business-jsonld');
    if (existing) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: BUSINESS_NAME,
      description:
        'Trusted neighborhood watch and jewelry repair bench at 233 East 84th Street, Manhattan. Serving the Upper East Side with expert mechanical and quartz watch repair, battery replacement, ring resizing, and fine jewelry repair.',
      url: window.location.origin,
      address: {
        '@type': 'PostalAddress',
        streetAddress: STREET_ADDRESS,
        addressLocality: ADDRESS_LOCALITY,
        addressRegion: ADDRESS_REGION,
        postalCode: POSTAL_CODE,
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.7763,
        longitude: -73.9535,
      },
      openingHours: OPENING_HOURS,
      openingHoursSpecification: OPENING_HOURS_SPEC,
      priceRange: '$$',
      currenciesAccepted: 'USD',
      paymentAccepted: 'Cash, Credit Card',
    };

    const script = document.createElement('script');
    script.id = 'local-business-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('local-business-jsonld');
      if (el) el.remove();
    };
  }, []);

  return null;
}
