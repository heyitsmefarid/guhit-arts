// Sample data: the built-in accounts' profiles and history, plus eight sample
// customers so the admin panel looks like a working shop. Logins (email and
// password) are set in data/credentials.js.
//
// Dates are generated relative to "now" so the demo always looks current.
// Reference numbers are assigned in date order across every customer; the
// next new order is GAC-ORD-01048 and the next digital request is GAC-DIG-00125.
import { STATUS_FLOW } from './statuses';
import { products } from './products';
import { getDigitalService } from './digitalServices';
import { buildHistory } from './history';

// Bump this when the sample data changes so browsers with older data reseed.
export const SEED_VERSION = 5;

export const initialCounters = { order: 1047, project: 124 };

function daysAgo(days, hours = 0) {
  return new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString();
}

function daysFromNow(days) {
  const d = new Date(Date.now() + days * 864e5);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// A plausible time of day for a sample order or request placed `d` days and
// `h` hours ago. Every item on the same day shares one clock time (minus its
// hour offset), so each list stays in date order.
function placedAt(d, h, kind) {
  if (d === 0) return daysAgo(0, h);
  const day = new Date(Date.now() - d * 864e5);
  day.setHours(0, 0, 0, 0);
  const minutes = kind === 'order' ? 9 * 60 + ((d * 173) % 600) : 10 * 60 + ((d * 211) % 640);
  return new Date(day.getTime() + minutes * 60000 - h * 36e5).toISOString();
}

// Who moves sample work along: counter staff for orders, the Hub designer for
// digital requests (names match the Team page).
const ORDER_TEAM = ['Mark Dizon', 'Ben Ramos', 'Mark Dizon', 'Lorna Guhit'];
const HUB_TEAM = ['Joy Macaraig', 'Joy Macaraig', 'Lorna Guhit'];

// Status history up to `status`: approved within a few hours of `createdAt`,
// then the remaining steps spread out until `endDaysAgo`.
function history(status, createdAt, endDaysAgo = 0, notes = {}, team = ORDER_TEAM) {
  const steps = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1);
  const now = Date.now() - 60000;
  const start = new Date(createdAt).getTime();
  const approved = Math.min(start + (1 + ((start / 36e5) % 2)) * 36e5, now);
  const end = Math.max(approved, Math.min(now, Date.now() - endDaysAgo * 864e5));
  return steps.map((s, i) => {
    let at = start;
    if (i === 1) at = approved;
    if (i > 1) at = approved + ((end - approved) * (i - 1)) / (steps.length - 2);
    const step = { status: s, at: new Date(at).toISOString(), note: notes[s] ?? '' };
    if (i > 0) step.by = team[(i + Math.floor(start / 36e5)) % team.length];
    return step;
  });
}

const PRODUCT = Object.fromEntries(products.map((p) => [p.id, p]));
const item = (id, qty, note = '') => ({
  productId: id,
  name: PRODUCT[id].name,
  price: PRODUCT[id].price,
  qty,
  image: PRODUCT[id].image,
  note,
});

const DELIVERY_FEE = 60;

function order(n, customer, [d, h = 0], status, fulfillment, payment, items, notes = {}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0;
  const createdAt = placedAt(d, h, 'order');
  const age = (Date.now() - new Date(createdAt)) / 864e5;
  // Shelf items are ready within the day; custom goods wait for proof approval.
  const custom = items.some((i) => i.productId.startsWith('cus-'));
  const lag = custom ? 2 + (n % 3) * 0.7 : 0.3 + (n % 4) * 0.25;
  return {
    ref: `GAC-ORD-${String(n).padStart(5, '0')}`,
    kind: 'order',
    createdAt,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    fulfillment,
    payment,
    contact: {
      name: customer.fullName,
      phone: customer.contactNumber,
      address: fulfillment === 'delivery' ? customer.address : '',
    },
    status,
    history: history(status, createdAt, status === 'completed' ? Math.max(age - lag, 0) : age * 0.25, notes),
  };
}

function project(n, customer, [d, h = 0], serviceId, status, { notes = {}, deadline, ...fields }) {
  const createdAt = placedAt(d, h, 'project');
  const age = (Date.now() - new Date(createdAt)) / 864e5;
  // Finished requests end when the final file was sent.
  const final = fields.deliverables?.find((f) => f.kind === 'final');
  const doneDaysAgo = final ? (Date.now() - new Date(final.at)) / 864e5 : Math.max(age - 4, 0);
  return {
    ref: `GAC-DIG-${String(n).padStart(5, '0')}`,
    kind: 'project',
    createdAt,
    serviceId,
    serviceName: getDigitalService(serviceId).name,
    customerName: customer.fullName,
    rush: false,
    instructions: '',
    files: [],
    deliverables: [],
    ...fields,
    deadline: daysFromNow(deadline),
    status,
    // Finished jobs record how many drafts the customer asked to change.
    ...(status === 'completed' && { revisions: (n * 7) % 3 }),
    history: history(status, createdAt, status === 'completed' ? doneDaysAgo : age * 0.25, notes, HUB_TEAM),
  };
}

const file = (name, kb) => ({ name, size: kb * 1024 });
const deliverable = (name, kb, kind, ago) => ({ name, size: kb * 1024, kind, at: daysAgo(ago) });

const notification = (id, [d, h = 0], title, body, link, kind, read) => ({
  id,
  createdAt: daysAgo(d, h),
  title,
  body,
  link,
  kind,
  read,
});

// ------------------------------------------------------------------
// Built-in account profiles
// ------------------------------------------------------------------
export const demoUser = {
  id: 'u-demo',
  role: 'customer',
  fullName: 'Andrea Villanueva',
  contactNumber: '0917 555 0123',
  address: 'Brgy. Lalud, Calapan City, Oriental Mindoro',
  avatar: null,
  createdAt: daysAgo(120),
};

export const studentUser = {
  id: 'u-student',
  role: 'customer',
  fullName: 'Juan dela Cruz',
  contactNumber: '0918 555 0199',
  address: 'Brgy. San Vicente South, Calapan City, Oriental Mindoro',
  avatar: null,
  createdAt: daysAgo(40),
};

export const adminUser = {
  id: 'u-admin',
  role: 'admin',
  active: true,
  fullName: 'Lorna Guhit',
  title: 'Owner and administrator',
  contactNumber: '0917 000 0000',
  address: 'Leuterio, San Vicente South, Calapan City',
  avatar: null,
  createdAt: daysAgo(900),
  lastLoginAt: daysAgo(1, 3),
};

export const staffUser = {
  id: 'u-staff',
  role: 'staff',
  active: true,
  fullName: 'Mark Dizon',
  title: 'Counter staff',
  contactNumber: '0917 000 0001',
  address: 'Brgy. Camilmil, Calapan City',
  avatar: null,
  createdAt: daysAgo(420),
  lastLoginAt: daysAgo(0, 9),
};

// Other team members, shown on the admin's Team page (they cannot log in).
export const sampleTeam = [
  {
    id: 't-joy',
    role: 'staff',
    active: true,
    sample: true,
    fullName: 'Joy Macaraig',
    title: 'Digital Help Hub designer',
    email: 'joy.macaraig@example.com',
    contactNumber: '0917 000 0002',
    address: 'Brgy. Lalud, Calapan City',
    avatar: null,
    createdAt: daysAgo(150),
    lastLoginAt: daysAgo(0, 4),
  },
  {
    id: 't-ben',
    role: 'staff',
    active: true,
    sample: true,
    fullName: 'Ben Ramos',
    title: 'Printing and tarpaulin',
    email: 'ben.ramos@example.com',
    contactNumber: '0917 000 0003',
    address: 'Brgy. Tawiran, Calapan City',
    avatar: null,
    createdAt: daysAgo(1300),
    lastLoginAt: daysAgo(2),
  },
  {
    id: 't-rose',
    role: 'staff',
    active: false,
    sample: true,
    fullName: 'Rose Aquino',
    title: 'Former cashier',
    email: 'rose.aquino@example.com',
    contactNumber: '0917 000 0004',
    address: 'Brgy. Sto. Niño, Calapan City',
    avatar: null,
    createdAt: daysAgo(800),
    lastLoginAt: daysAgo(64),
  },
];

// ------------------------------------------------------------------
// Sample customers (shown in the admin panel; they cannot log in)
// ------------------------------------------------------------------
const customer = (id, fullName, email, contactNumber, address, ago) => ({
  id,
  role: 'customer',
  sample: true,
  fullName,
  email,
  contactNumber,
  address,
  avatar: null,
  createdAt: daysAgo(ago),
});

const handWrittenCustomers = [
  customer('c-maria', 'Maria Santos', 'maria.santos@example.com', '0917 812 4410', 'Brgy. Ibaba East, Calapan City', 210),
  customer('c-rafael', 'Rafael Mendoza', 'rafael.mendoza@example.com', '0928 334 1902', 'Brgy. Guinobatan, Calapan City', 400),
  customer('c-kristine', 'Kristine Dela Peña', 'kristine.delapena@example.com', '0995 221 7734', 'Brgy. Lumangbayan, Calapan City', 95),
  customer('c-jomar', 'Jomar Aguilar', 'jomar.aguilar@example.com', '0906 447 1180', 'Brgy. Bayanan I, Calapan City', 160),
  customer('c-liza', 'Liza Fernandez', 'liza.fernandez@example.com', '0917 603 5528', 'Poblacion, Naujan, Oriental Mindoro', 300),
  customer('c-paolo', 'Paolo Reyes', 'paolo.reyes@example.com', '0939 118 6402', 'Brgy. Sta. Isabel, Calapan City', 70),
  customer('c-grace', 'Grace Villamor', 'grace.villamor@example.com', '0977 250 3316', 'Brgy. Suqui, Calapan City', 250),
  customer('c-nestor', 'Nestor Castillo', 'nestor.castillo@example.com', '0918 702 4459', 'Poblacion, Baco, Oriental Mindoro', 520),
];

const C = Object.fromEntries([demoUser, studentUser, ...handWrittenCustomers].map((c) => [c.id, c]));

// A year of older, completed history for the Reports page (see data/history.js),
// with the extra sample customers who placed it.
const HISTORY = buildHistory(handWrittenCustomers);
export const sampleCustomers = [...handWrittenCustomers, ...HISTORY.customers];

// ------------------------------------------------------------------
// Orders, in date order (oldest first)
// ------------------------------------------------------------------
const ORDERS = [
  ['c-nestor', order(1020, C['c-nestor'], [30], 'completed', 'pickup', 'cash', [item('sch-mongol', 20), item('sch-notebook', 40), item('sch-ballpens', 15), item('sch-long-envelope', 30)])],
  ['c-maria', order(1021, C['c-maria'], [29], 'completed', 'pickup', 'cash', [item('sch-cartolina', 5), item('art-oil-pastels', 6), item('sch-illustration-board', 10)])],
  ['c-rafael', order(1022, C['c-rafael'], [28], 'completed', 'delivery', 'gcash', [item('cus-tarpaulin', 4, 'Barangay clean-up drive, 3 × 5 ft with eyelets')])],
  ['c-jomar', order(1023, C['c-jomar'], [27], 'completed', 'pickup', 'gcash', [item('spt-basketball', 2), item('spt-volleyball', 1)])],
  ['u-demo', order(1024, C['u-demo'], [26], 'completed', 'pickup', 'cash', [item('sch-mongol', 2), item('sch-yellow-pad', 3), item('sch-cartolina', 1)])],
  ['c-paolo', order(1025, C['c-paolo'], [25], 'completed', 'pickup', 'cash', [item('prt-bond-a4', 2), item('prt-ink', 1)])],
  ['c-grace', order(1026, C['c-grace'], [24], 'completed', 'delivery', 'maya', [item('cus-tarpaulin', 2, 'Debut backdrop, gold and blush'), item('cus-mug', 30, 'Souvenir mugs, guest names in the attached list')])],
  ['c-liza', order(1027, C['c-liza'], [22], 'completed', 'pickup', 'gcash', [item('prt-sticker-paper', 6), item('cus-keychain', 50, 'Café logo keychains for loyalty cards')])],
  ['c-kristine', order(1028, C['c-kristine'], [21], 'completed', 'pickup', 'cash', [item('art-sketchbook', 2), item('art-colored-pencils', 1), item('art-brush-set', 1)])],
  ['u-demo', order(1029, C['u-demo'], [20], 'completed', 'pickup', 'gcash', [item('prt-bond-long', 1), item('sch-ballpens', 1), item('prt-photo-paper', 1)])],
  ['c-nestor', order(1030, C['c-nestor'], [18], 'completed', 'pickup', 'cash', [item('sch-yellow-pad', 40), item('sch-cartolina', 10), item('sch-mongol', 10)])],
  ['c-jomar', order(1031, C['c-jomar'], [16], 'completed', 'delivery', 'gcash', [item('cus-jersey', 15, 'Bayanan Ballers. Names and numbers in the attached list.')])],
  ['c-rafael', order(1032, C['c-rafael'], [14], 'completed', 'pickup', 'cash', [item('cus-id-lace', 40, 'Barangay volunteer IDs')])],
  ['u-student', order(1033, C['u-student'], [13], 'completed', 'pickup', 'cash', [item('sch-mongol', 1), item('sch-yellow-pad', 2), item('sch-long-envelope', 1)])],
  ['c-paolo', order(1034, C['c-paolo'], [11], 'completed', 'pickup', 'gcash', [item('sch-calculator', 1), item('prt-photo-paper', 1)])],
  ['c-grace', order(1035, C['c-grace'], [10], 'completed', 'pickup', 'maya', [item('cus-pins', 5, 'Event staff pins'), item('prt-specialty', 3)])],
  ['u-demo', order(1036, C['u-demo'], [9, 4], 'for_revision', 'delivery', 'gcash', [item('cus-jersey', 12, 'Team: Lalud Warriors. Names and numbers are in the attached list.')], { for_revision: 'Print proof sent. Waiting for your approval.' })],
  ['c-liza', order(1037, C['c-liza'], [9], 'completed', 'delivery', 'gcash', [item('cus-mug', 12, 'Café logo, two colors'), item('cus-tumbler', 4, 'Staff names')])],
  ['c-kristine', order(1038, C['c-kristine'], [8], 'completed', 'pickup', 'cash', [item('art-acrylic-set', 1), item('art-canvas', 2)])],
  ['c-maria', order(1039, C['c-maria'], [6], 'completed', 'pickup', 'cash', [item('cus-plaque', 3, 'Teacher of the Year awards, names attached')])],
  ['c-nestor', order(1040, C['c-nestor'], [5], 'in_progress', 'pickup', 'cash', [item('sch-notebook', 60), item('sch-ballpens', 20)])],
  ['c-jomar', order(1041, C['c-jomar'], [4], 'for_revision', 'delivery', 'gcash', [item('cus-shirt', 20, 'Team shirts: front logo, back numbers')], { for_revision: 'Proof sent on Messenger.' })],
  ['u-demo', order(1042, C['u-demo'], [3, 2], 'in_progress', 'pickup', 'gcash', [item('art-acrylic-set', 1), item('art-brush-set', 1), item('art-canvas', 2)])],
  ['c-paolo', order(1043, C['c-paolo'], [3], 'approved', 'pickup', 'gcash', [item('prt-bond-a4', 1), item('prt-photo-paper', 2)])],
  ['c-grace', order(1044, C['c-grace'], [2], 'in_progress', 'delivery', 'maya', [item('cus-tarpaulin', 1, 'Wedding welcome sign'), item('cus-mug', 50, 'Wedding giveaways, couple names on the back')])],
  ['c-rafael', order(1045, C['c-rafael'], [1], 'approved', 'delivery', 'cash', [item('cus-tarpaulin', 6, 'Fiesta announcements, 6 designs')])],
  ['u-student', order(1046, C['u-student'], [0, 10], 'pending', 'pickup', 'gcash', [item('prt-bond-long', 1), item('sch-illustration-board', 3)])],
  ['c-liza', order(1047, C['c-liza'], [0, 6], 'pending', 'pickup', 'gcash', [item('prt-sticker-paper', 4), item('cus-pins', 10, 'Loyalty card pins')])],
];

// ------------------------------------------------------------------
// Digital projects, in date order (oldest first)
// ------------------------------------------------------------------
const PROJECTS = [
  ['u-demo', project(108, C['u-demo'], [28], 'resume', 'completed', {
    title: 'Resume for OJT application',
    description: 'One-page resume for my OJT applications in Calapan.',
    deadline: -24, budget: 150, price: 150,
    files: [file('old-resume.pdf', 86)],
    deliverables: [deliverable('Villanueva-Resume-Final.pdf', 142, 'final', 24)],
  })],
  ['c-kristine', project(109, C['c-kristine'], [26], 'resume', 'completed', {
    title: 'Resume for scholarship interview',
    description: 'One-page resume highlighting art awards and org work.',
    deadline: -21, budget: 200, price: 150,
    files: [file('awards-list.docx', 22)],
    deliverables: [deliverable('DelaPena-Resume.pdf', 138, 'final', 22)],
  })],
  ['c-paolo', project(110, C['c-paolo'], [23], 'powerpoint', 'completed', {
    title: 'Thesis proposal defense deck',
    description: 'Around 30 slides for our research proposal. Content is final in the Word file.',
    deadline: -18, budget: 500, price: 450,
    files: [file('proposal-chapters.docx', 310), file('dept-logo.png', 96)],
    deliverables: [deliverable('Proposal-Defense.pptx', 4200, 'final', 18)],
    notes: { approved: 'Quoted at ₱450 for 30 slides.' },
  })],
  ['c-liza', project(111, C['c-liza'], [20], 'qr', 'completed', {
    title: 'Menu QR code for tables',
    description: 'QR code that opens our Google Drive menu, with the café logo in the middle.',
    deadline: -19, budget: 100, price: 50,
    deliverables: [deliverable('Kape-at-Tinapay-QR.png', 64, 'final', 19)],
  })],
  ['c-grace', project(112, C['c-grace'], [17], 'invitation', 'completed', {
    title: 'Wedding e-invitation',
    description: 'Digital invitation for Messenger, sage green theme, with an RSVP link.',
    deadline: -10, budget: 400, price: 250,
    files: [file('couple-photo.jpg', 1840)],
    deliverables: [deliverable('Wedding-Invitation.png', 980, 'final', 12)],
  })],
  ['c-maria', project(113, C['c-maria'], [15], 'infographic', 'completed', {
    title: 'Dengue awareness infographic',
    description: 'A4 infographic for Grade 8 classrooms: symptoms, prevention, and the 4S strategy.',
    deadline: -9, budget: 300, price: 300,
    files: [file('4S-strategy-notes.docx', 34)],
    deliverables: [deliverable('Dengue-Infographic-A4.pdf', 2100, 'final', 10)],
  })],
  ['c-rafael', project(114, C['c-rafael'], [12], 'pubmat', 'completed', {
    title: 'Barangay fiesta pubmat',
    description: 'Facebook pubmat for the fiesta schedule, square and story sizes.',
    deadline: -6, budget: 250, price: 200,
    files: [file('fiesta-schedule.docx', 18)],
    deliverables: [deliverable('Fiesta-Pubmat-Square.png', 1250, 'final', 7)],
  })],
  ['u-student', project(115, C['u-student'], [9], 'resume', 'completed', {
    title: 'Resume for part-time job',
    description: 'Simple one-page resume for a weekend cashier job.',
    deadline: -5, budget: 150, price: 150,
    files: [file('my-details.docx', 16)],
    deliverables: [deliverable('DelaCruz-Resume.pdf', 128, 'final', 6)],
  })],
  ['c-jomar', project(116, C['c-jomar'], [7], 'pubmat', 'for_revision', {
    title: 'Summer league poster',
    description: 'Poster for the Bayanan summer basketball league with team logos.',
    deadline: 2, budget: 250, price: 200,
    files: [file('team-logos.zip', 3400)],
    deliverables: [deliverable('Summer-League-Draft1.png', 1180, 'draft', 1)],
    notes: { for_revision: 'Draft 1 sent. Waiting for changes.' },
  })],
  ['u-demo', project(117, C['u-demo'], [6, 3], 'powerpoint', 'in_progress', {
    title: 'Thesis defense slides',
    description: 'About 25 slides for our final defense. We have the content in a Word file and need a clean, readable design.',
    deadline: 8, budget: 500, price: 350,
    instructions: 'Keep the school logo on the title slide.',
    files: [file('thesis-outline.docx', 54), file('school-logo.png', 118)],
    notes: { approved: 'Quoted at ₱350 for 25 slides.' },
  })],
  ['c-kristine', project(118, C['c-kristine'], [6], 'portfolio', 'in_progress', {
    title: 'Fine arts application portfolio',
    description: 'A 16-page PDF portfolio of paintings and sketches for a college application.',
    deadline: 6, budget: 700, price: 600,
    files: [file('artwork-photos.zip', 18400)],
    notes: { approved: 'Quoted at ₱600 for 16 pages.' },
  })],
  ['u-demo', project(119, C['u-demo'], [4, 5], 'pubmat', 'for_revision', {
    title: 'General assembly pubmat',
    description: 'Facebook pubmat for the Arts Society general assembly. Square and story sizes.',
    deadline: 2, budget: 250, price: 200,
    instructions: 'Use our org colors: navy and gold.',
    files: [file('org-logo.png', 235)],
    deliverables: [deliverable('GA-Pubmat-Draft1.png', 1320, 'draft', 0.4)],
    notes: { for_revision: 'First draft sent for review.' },
  })],
  ['c-liza', project(120, C['c-liza'], [4], 'website', 'approved', {
    title: 'Café one-page website',
    description: 'One page with menu, hours, map, and Facebook link. We already have photos.',
    deadline: 18, budget: 4000, price: 3500,
    files: [file('cafe-photos.zip', 22100), file('menu-2026.pdf', 410)],
    notes: { approved: 'Quoted at ₱3,500 including domain setup.' },
  })],
  ['u-student', project(121, C['u-student'], [3], 'powerpoint', 'in_progress', {
    title: 'Science investigatory project slides',
    description: '12 slides for our SIP presentation on banana-peel bioplastic.',
    deadline: 3, budget: 300, price: 250,
    files: [file('sip-paper.docx', 88)],
  })],
  ['c-paolo', project(122, C['c-paolo'], [1], 'custom', 'pending', {
    title: 'Logo for org merchandise',
    description: 'A simple logo for our Computer Science society shirts and stickers.',
    deadline: 10, budget: 800, price: null,
    files: [file('logo-ideas-sketch.jpg', 640)],
  })],
  ['c-maria', project(123, C['c-maria'], [0, 9], 'pubmat', 'pending', {
    title: 'Science fair poster',
    description: 'Poster announcing the school science fair, A3 print and Facebook size.',
    deadline: 5, budget: 250, price: 150,
  })],
  ['u-demo', project(124, C['u-demo'], [0, 5], 'invitation', 'pending', {
    title: 'Debut invitation for my sister',
    description: 'Elegant digital invitation for an 18th birthday. Theme is dusty blue and silver. Need a version for Messenger and one for printing.',
    deadline: 20, budget: 300, price: 150,
    instructions: 'Include an RSVP QR code that links to our Google Form.',
    files: [file('debut-details.docx', 18)],
  })],
];

const NOTIFICATIONS = {
  'u-demo': [
    notification('n-d5', [0, 5], 'Request GAC-DIG-00124 received', 'We will review your Digital Invitation request within the day.', '/app/track/GAC-DIG-00124', 'project', false),
    notification('n-d4', [0, 10], 'Draft ready for GAC-DIG-00119', 'Your pubmat draft is ready. Review it and send any changes.', '/app/track/GAC-DIG-00119', 'project', false),
    notification('n-d3', [1], 'Proof ready for GAC-ORD-01036', 'Check the jersey layout and approve it so we can start printing.', '/app/track/GAC-ORD-01036', 'order', false),
    notification('n-d2', [2], 'Order GAC-ORD-01042 is being prepared', 'We are packing your art supplies. We will message you when they are ready for pickup.', '/app/track/GAC-ORD-01042', 'order', true),
    notification('n-d1', [24], 'GAC-DIG-00108 completed', 'Your resume files are ready to download.', '/app/track/GAC-DIG-00108', 'project', true),
  ],
  'u-student': [
    notification('n-s5', [0, 10], 'Order GAC-ORD-01046 received', 'We will confirm stock and message you when it is ready for pickup.', '/app/track/GAC-ORD-01046', 'order', false),
    notification('n-s4', [2], 'GAC-DIG-00121 is now In Progress', 'A designer is working on your SIP slides.', '/app/track/GAC-DIG-00121', 'project', false),
    notification('n-s3', [6], 'GAC-DIG-00115 completed', 'Your resume is ready to download.', '/app/track/GAC-DIG-00115', 'project', true),
    notification('n-s2', [11], 'Order GAC-ORD-01033 is ready', 'Your school supplies are ready for pickup at the counter.', '/app/track/GAC-ORD-01033', 'order', true),
    notification('n-s1', [40], 'Welcome to Guhit, Juan', 'Shop supplies and custom goods, or request a digital service from the Student Digital Help Hub.', '/app', 'account', true),
  ],
};

// Returns { [userId]: { orders, projects, notifications } } for every account
// that has sample history, newest items first (as the app stores them).
export function buildSampleAccounts() {
  const accounts = {};
  const ensure = (id) => (accounts[id] ??= { orders: [], projects: [], notifications: NOTIFICATIONS[id] ?? [] });
  for (const [id, o] of [...HISTORY.orders, ...ORDERS]) ensure(id).orders.unshift(o);
  for (const [id, p] of [...HISTORY.projects, ...PROJECTS]) ensure(id).projects.unshift(p);
  return accounts;
}

export function buildNewAccount(firstName) {
  return {
    orders: [],
    projects: [],
    notifications: [
      {
        id: `n-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: `Welcome to Guhit, ${firstName}`,
        body: 'Shop supplies and custom goods, or request a digital service from the Student Digital Help Hub.',
        link: '/app',
        kind: 'account',
        read: false,
      },
    ],
  };
}
