// Student Digital Help Hub: the proposed digital service division.
// `startingPrice` is null for quotation-based services. `icon` is a Lucide icon name
// resolved in components/digital/ServiceIcon.jsx.

export const RUSH_FEE = { percent: 30, minimum: 100 };

// Rush fee for a fixed-rate service. Quotation-based services include it in the quote.
export const rushFeeFor = (base) =>
  base ? Math.max(Math.ceil((base * RUSH_FEE.percent) / 100), RUSH_FEE.minimum) : null;

export const digitalServices = [
  {
    id: 'resume',
    name: 'Resume / CV Creation',
    short: 'Resume / CV',
    icon: 'FileText',
    startingPrice: 150,
    turnaround: '1–2 days',
    description: 'A clean one- or two-page resume for job, OJT, or scholarship applications. Includes one round of revisions.',
  },
  {
    id: 'portfolio',
    name: 'Portfolio Design',
    short: 'Portfolio',
    icon: 'BookOpen',
    startingPrice: 300,
    turnaround: '3–5 days',
    description: 'A designed PDF portfolio that shows your artworks, projects, or photos in a clear, professional layout.',
  },
  {
    id: 'powerpoint',
    name: 'PowerPoint Presentation Design',
    short: 'PowerPoint',
    icon: 'Presentation',
    startingPrice: 200,
    turnaround: '2–3 days',
    description: 'Slides for reports, thesis defenses, and pitches, designed from your outline and content.',
  },
  {
    id: 'infographic',
    name: 'Infographics',
    short: 'Infographic',
    icon: 'ChartPie',
    startingPrice: 200,
    turnaround: '2–3 days',
    description: 'Turn research findings, steps, or data into one visual summary for printing or posting.',
  },
  {
    id: 'pubmat',
    name: 'Event Posters / Pubmats',
    short: 'Poster / Pubmat',
    icon: 'Megaphone',
    startingPrice: 150,
    turnaround: '1–2 days',
    description: 'Posters and publication materials for org events, sized for Facebook, Instagram, or print.',
  },
  {
    id: 'qr',
    name: 'QR Code Services',
    short: 'QR Code',
    icon: 'QrCode',
    startingPrice: 50,
    turnaround: 'Same day',
    description: 'QR codes for forms, menus, payment links, and event sign-ups, delivered as print-ready files.',
  },
  {
    id: 'invitation',
    name: 'Digital Invitations',
    short: 'Digital Invitation',
    icon: 'MailOpen',
    startingPrice: 150,
    turnaround: '2–3 days',
    description: 'Invitations for debuts, weddings, baptisms, and birthdays, ready to send on Messenger or to print.',
  },
  {
    id: 'website',
    name: 'Website Creation',
    short: 'Website',
    icon: 'Globe',
    startingPrice: 1500,
    turnaround: '7–14 days',
    description: 'A one-page or small-business website, with help setting up the domain and hosting.',
  },
  {
    id: 'printing',
    name: 'Printing of Digital Outputs',
    short: 'Printing',
    icon: 'Printer',
    startingPrice: null,
    priceNote: 'Quotation',
    turnaround: 'Same day – 2 days',
    description: 'Print your finished files on bond paper, photo paper, sticker paper, or tarpaulin at the shop.',
  },
  {
    id: 'rush',
    name: 'Rush Orders',
    short: 'Rush Order',
    icon: 'Zap',
    startingPrice: null,
    priceNote: 'Additional fee',
    turnaround: '24 hours or less',
    description: `Need it sooner? We move your project to the front of the queue for an added ${RUSH_FEE.percent}% (minimum ₱${RUSH_FEE.minimum}).`,
  },
  {
    id: 'custom',
    name: 'Custom Digital Projects',
    short: 'Custom Project',
    icon: 'Sparkles',
    startingPrice: null,
    priceNote: 'Quotation',
    turnaround: 'Depends on scope',
    description: "Anything not listed here: logos, menus, certificates, social media kits. Tell us what you need and we'll send a quote.",
  },
];

// Services a customer can pick in the commission form. "Rush Orders" is an add-on,
// so it appears as a checkbox on the form instead of a service choice.
export const requestableServices = digitalServices.filter((s) => s.id !== 'rush');

export const getDigitalService = (id) => digitalServices.find((s) => s.id === id);

export const hubSteps = [
  { title: 'Choose a service', body: 'Pick what you need, or choose Custom Project if it is not on the list.' },
  { title: 'Send your brief', body: 'Describe the project, set a deadline and budget, and attach your files.' },
  { title: 'Get approved', body: 'We review the request and confirm the price. Complex work gets a quotation first.' },
  { title: 'Review the draft', body: 'You check the first version and ask for changes if something is off.' },
  { title: 'Receive your files', body: 'Download the final files, or have them printed at the shop.' },
];
