export const BUSINESS_NAME = 'Upper East Watch Repair';
export const STREET_ADDRESS = '233 East 84th Street';
export const ADDRESS_LOCALITY = 'New York';
export const ADDRESS_REGION = 'NY';
export const POSTAL_CODE = '10028';
export const ADDRESS_SINGLE_LINE =
  `${STREET_ADDRESS}, ${ADDRESS_LOCALITY}, ${ADDRESS_REGION} ${POSTAL_CODE}`;
export const MAPS_URL =
  'https://maps.google.com/?q=233+East+84th+Street+New+York+NY';

// TODO(hours): client must confirm exact hours before launch.
export const HOURS_DISPLAY = [
  { days: 'Monday – Friday', hours: '10:00 am – 6:00 pm' },
  { days: 'Saturday', hours: 'Closed' },
  { days: 'Sunday', hours: '11:00 am – 5:00 pm' },
] as const;

export const OPENING_HOURS = ['Mo-Fr 10:00-18:00', 'Su 11:00-17:00'] as const;

export const OPENING_HOURS_SPEC = [
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
] as const;