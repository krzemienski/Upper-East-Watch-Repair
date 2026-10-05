export interface ServiceItem {
  title: string;
  description: string;
  details: string[];
  href: string;
  ctaLabel: string;
}

export const services: ServiceItem[] = [
  {
    title: 'Watch Repair',
    description: 'From quartz battery swaps to full mechanical movement overhauls, every watch receives the precision care it deserves.',
    details: [
      'Quartz and mechanical movement service',
      'All major brands accepted',
      'Crystal replacement',
      'Crown and stem repair',
      'Gasket and water-resistance restoration',
      'Case and bracelet refinishing',
    ],
    href: '/services/watch-repair',
    ctaLabel: 'Learn about watch repair',
  },
  {
    title: 'Battery Replacement',
    description: 'Swiss batteries, professional testing, and water-resistance care — from $15 to $50 depending on watch complexity.',
    details: [
      'Genuine Swiss batteries',
      'Water-resistance pressure test',
      'Movement inspection included',
      'Most watches completed while you wait',
      'Starting from $15',
    ],
    href: '/services/battery-replacement',
    ctaLabel: 'Battery replacement details',
  },
];
