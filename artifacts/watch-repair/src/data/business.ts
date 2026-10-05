export const BUSINESS_NAME = 'Upper East Watch Repair';
export const SITE_URL = 'https://uppereastwatchrepair.com';
export const WORKBENCH_OG_IMAGE_URL =
  `${SITE_URL}/media/upper-east-watch-repair-workbench-og.webp`;
/** Branded 1200x630 share card used for Open Graph and Twitter cards. */
export const SHARE_IMAGE_URL = `${SITE_URL}/og/upper-east-watch-repair-share.png`;

/** Public shop phone, supplied at build time. When unset, call CTAs are hidden. */
export const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string | undefined)?.trim() || '';
export const TEL_URL = BUSINESS_PHONE ? `tel:${BUSINESS_PHONE.replace(/[^\d+]/g, '')}` : '';
export const STREET_ADDRESS = '233 East 84th Street';
export const ADDRESS_LOCALITY = 'New York';
export const ADDRESS_REGION = 'NY';
export const POSTAL_CODE = '10028';
export const ADDRESS_SINGLE_LINE =
  `${STREET_ADDRESS}, ${ADDRESS_LOCALITY}, ${ADDRESS_REGION} ${POSTAL_CODE}`;
export const MAPS_URL =
  'https://maps.app.goo.gl/ZsbqnKudQrDjQrGn8?g_st=ic';

export const HOURS_DISPLAY = [
  { days: 'Monday – Friday', hours: '9:00 am – 7:00 pm' },
  { days: 'Saturday', hours: 'Closed' },
  { days: 'Sunday', hours: '9:00 am – 6:00 pm' },
] as const;

export const OPENING_HOURS = ['Mo-Fr 09:00-19:00', 'Su 09:00-18:00'] as const;

export const OPENING_HOURS_SPEC = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '19:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Sunday'],
    opens: '09:00',
    closes: '18:00',
  },
] as const;