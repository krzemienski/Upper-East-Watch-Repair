import { useEffect } from 'react';

export function LocalBusinessJsonLd() {
  useEffect(() => {
    const existing = document.getElementById('local-business-jsonld');
    if (existing) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Upper East Watch Repair',
      description:
        'Trusted neighborhood watch and jewelry repair bench at 233 East 84th Street, Manhattan. Serving the Upper East Side with expert mechanical and quartz watch repair, battery replacement, ring resizing, and fine jewelry repair.',
      url: window.location.origin,
      telephone: '',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '233 East 84th Street',
        addressLocality: 'New York',
        addressRegion: 'NY',
        postalCode: '10028',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.7763,
        longitude: -73.9535,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '10:00',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Sunday'],
          opens: '11:00',
          closes: '17:00',
        },
      ],
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
