// Business profile. Contact details marked `placeholder` should be replaced
// with the shop's real information before the site goes live.
export const business = {
  name: 'Guhit Arts Center',
  founded: 1979,
  address: {
    line1: 'Leuterio, San Vicente South',
    line2: 'Calapan City, Oriental Mindoro',
    full: 'Leuterio, San Vicente South, Calapan City, Oriental Mindoro',
  },
  phone: { mobile: '0917 000 0000', landline: '(043) 000 0000', placeholder: true },
  email: { value: 'info@guhitartscenter.ph', placeholder: true },
  hours: [
    { days: 'Monday to Saturday', time: '8:00 AM – 6:00 PM' },
    { days: 'Sunday', time: '9:00 AM – 12:00 NN' },
    { days: 'Holidays', time: 'Call ahead' },
  ],
  socials: [
    { id: 'facebook', label: 'Facebook', handle: 'Guhit Arts Center', href: '#' },
    { id: 'instagram', label: 'Instagram', handle: '@guhitartscenter', href: '#' },
    { id: 'messenger', label: 'Messenger', handle: 'm.me/guhitartscenter', href: '#' },
  ],
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Leuterio, San Vicente South, Calapan City, Oriental Mindoro'),
};

export const yearsInService = () => new Date().getFullYear() - business.founded;

// The four divisions of the shop. Each is keyed to one process ink (C, M, Y, K),
// which is how the site colors everything that belongs to that division.
export const divisions = [
  {
    id: 'printing',
    name: 'Printing Services',
    ink: 'cyan',
    image: 'printing',
    summary:
      'Document and large-format printing for school, business, and events, from a single page to a stage backdrop.',
    offerings: ['Tarpaulin and banners', 'Document and photo printing', 'Stickers and labels', 'Calling cards and certificates', 'Lamination'],
    shopCategory: 'printing',
  },
  {
    id: 'art',
    name: 'Art Services',
    ink: 'magenta',
    image: 'art',
    summary:
      'Where the shop started in 1979. Hand lettering, signage, layout, and artwork done by people who draw for a living.',
    offerings: ['Signage and hand lettering', 'Logo and layout design', 'Portraits and illustrations', 'Murals and backdrops', 'Art supplies'],
    shopCategory: 'art',
  },
  {
    id: 'custom',
    name: 'Customized Products',
    ink: 'yellow',
    image: 'custom',
    summary:
      'Your design on things people actually use. Shirts, mugs, jerseys, IDs, and giveaways for teams, orgs, and events.',
    offerings: ['Printed shirts and jerseys', 'Mugs and tumblers', 'ID laces and IDs', 'Button pins and keychains', 'Plaques and awards'],
    shopCategory: 'custom',
  },
  {
    id: 'sports',
    name: 'Sporting Goods',
    ink: 'ink',
    image: 'sports',
    summary:
      'Balls, rackets, and gear for PE class, intramurals, and the barangay league, plus team uniforms printed in-house.',
    offerings: ['Basketball and volleyball', 'Badminton and table tennis', 'Chess and board games', 'Team uniforms', 'Trophies and medals'],
    shopCategory: 'sports',
  },
];

// Milestones for the About section. Only 1979 and the present are dated;
// the middle steps describe how the shop grew without inventing specific years.
export const milestones = [
  { when: '1979', title: 'A small art service shop', body: 'Guhit starts in Calapan as a place for hand-painted signs, lettering, and artwork.' },
  { when: 'Then', title: 'Printing comes in-house', body: 'Document, photo, and tarpaulin printing join the art services as the city grows.' },
  { when: 'Then', title: 'Custom goods and sporting goods', body: 'Printed shirts, mugs, jerseys, and school sports supplies fill out the shelves.' },
  { when: 'Today', title: 'Four divisions under one roof', body: 'Students, teachers, teams, and local businesses come to one counter for all of it.' },
  { when: 'Next', title: 'Student Digital Help Hub', body: 'A proposed division for resumes, slides, pubmats, and other digital work, ordered online.' },
];
