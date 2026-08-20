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
    name: 'Claudia M.',
    text: 'My engagement ring had a loose prong that was terrifying me. They fixed it same day and the setting looks brand new. Honest pricing, zero upsell.',
    service: 'Jewelry Repair',
  },
  {
    name: 'David K.',
    text: 'I sent in a Patek Philippe for a full service. The movement came back better than when it left the manufacturer — cleaned, lubricated, timing perfect on all positions. Truly rare craftsmanship.',
    service: 'High-End Mechanical',
  },
  {
    name: 'Susan L.',
    text: 'Resized my mother\'s gold band for my daughter\'s wedding. They matched the finish exactly. You cannot tell it was ever altered. Exceptional work.',
    service: 'Ring Resizing',
  },
  {
    name: 'Thomas B.',
    text: 'Dropped off a TAG Heuer with a cracked crystal. Ready the next morning, flawless crystal and the bezel looks like new. Pricing was exactly what they quoted, no surprises.',
    service: 'Crystal Replacement',
  },
  {
    name: 'Anita V.',
    text: 'My gold chain had a broken clasp and a snapped link. They repaired both invisibly — the solder is seamless. Picked it up the same afternoon I dropped it off.',
    service: 'Chain Repair',
  },
  {
    name: 'Robert F.',
    text: 'Have been a customer since 2011. Every watch in my collection has passed through their bench at some point. Their consistency and honesty are unmatched on the Upper East Side.',
    service: 'Regular Customer',
  },
];
