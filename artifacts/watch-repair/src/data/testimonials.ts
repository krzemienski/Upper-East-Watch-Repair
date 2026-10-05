export interface Testimonial {
  name: string;
  text: string;
  service: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Margaret T.',
    text: 'Brought in my grandmother\'s Omega that hadn\'t run in decades. They returned it running perfectly, cleaned and regulated to spec. The care they took was extraordinary.',
    service: 'Mechanical Repair',
  },
  {
    name: 'James R.',
    text: 'Quick battery replacement while I waited, and they tested the water resistance at no extra charge. Have been going back for five years now. The most trustworthy shop in the neighborhood.',
    service: 'Battery Replacement',
  },
  {
    name: 'David K.',
    text: 'I sent in a Patek Philippe for a full service. The movement came back better than when it left the manufacturer — cleaned, lubricated, timing perfect on all positions. Truly rare craftsmanship.',
    service: 'High-End Mechanical',
  },
  {
    name: 'Thomas B.',
    text: 'Dropped off a TAG Heuer with a cracked crystal. Ready the next morning, flawless crystal and the bezel looks like new. Pricing was exactly what they quoted, no surprises.',
    service: 'Crystal Replacement',
  },
  {
    name: 'Robert F.',
    text: 'Have been a customer since 2011. Every watch in my collection has passed through their bench at some point. Their consistency and honesty are unmatched on the Upper East Side.',
    service: 'Regular Customer',
  },
];
