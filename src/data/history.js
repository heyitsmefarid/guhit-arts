// Older sample history for the Reports page: the eleven months before the
// hand-written sample orders in seed.js. It is generated from a fixed seed, so
// the records are the same in every browser. Everything here is completed.
//
// - Shop orders follow the school and fiesta calendar of Oriental Mindoro:
//   school supplies peak when classes open in June, custom goods before
//   Christmas and graduation, sporting goods around summer leagues and
//   intramurals. Online orders grow over the year.
// - The Student Digital Help Hub opened as a pilot about nine months ago, so
//   digital requests start then and grow from there.
// - Reference numbers end just before the ones in seed.js (GAC-ORD-01020 and
//   GAC-DIG-00108), so every number stays in date order.
import { products } from './products';
import { getDigitalService, rushFeeFor } from './digitalServices';

const DAY = 864e5;
const HOUR = 36e5;
const OLDEST_DAYS_AGO = 365;
const NEWEST_DAYS_AGO = 31; // seed.js covers the last 30 days
export const HUB_OPENED_DAYS_AGO = 270;
const LAST_ORDER_NO = 1019;
const PROJECT_COUNT = 107; // GAC-DIG-00001 to GAC-DIG-00107
const DELIVERY_FEE = 60;

// ------------------------------------------------------------------
// Seeded randomness
// ------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1979);
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;
function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}
function poisson(lambda) {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rand();
  } while (p > limit);
  return k - 1;
}

const localDate = (ms) => {
  const d = new Date(ms);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);

// ------------------------------------------------------------------
// The calendar: how busy each month is, per shop category (1 = ordinary)
// ------------------------------------------------------------------
const MONTH_BUSY = [0.8, 0.9, 1.25, 1.0, 1.1, 1.6, 1.1, 1.0, 1.0, 1.1, 1.1, 1.5];
const WEEKDAY_BUSY = [0.45, 1.0, 0.95, 1.0, 1.05, 1.15, 1.35]; // Sunday first
const SEASON = {
  school: [0.8, 0.8, 0.9, 0.5, 1.2, 2.6, 1.4, 1.0, 1.0, 0.9, 0.9, 0.6],
  art: [0.9, 1.0, 1.1, 0.8, 0.9, 1.6, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0],
  printing: [1.0, 1.0, 1.4, 0.9, 0.9, 1.3, 1.1, 1.1, 1.0, 1.1, 1.1, 1.1],
  sports: [0.8, 0.9, 1.0, 1.6, 1.5, 1.0, 0.9, 0.9, 1.0, 1.5, 1.0, 1.2],
  custom: [0.7, 1.2, 1.6, 1.0, 1.2, 0.8, 0.8, 0.9, 1.0, 1.1, 1.3, 2.2],
};
const ORDER_HOURS = [[8, 2], [9, 4], [10, 6], [11, 6], [12, 3], [13, 4], [14, 5], [15, 6], [16, 5], [17, 3], [18, 1], [19, 2], [20, 3], [21, 2], [22, 1]];
const EVENING_HOURS = [[9, 1], [10, 2], [13, 2], [15, 2], [17, 2], [19, 3], [20, 4], [21, 4], [22, 2], [23, 1]];

// ------------------------------------------------------------------
// Who buys what. [productId, weight, [minQty, maxQty]]
// ------------------------------------------------------------------
const PICKS = {
  student: [
    ['sch-mongol', 5, [1, 2]], ['sch-notebook', 5, [2, 6]], ['sch-yellow-pad', 5, [1, 3]], ['sch-ballpens', 4, [1, 2]],
    ['sch-cartolina', 4, [1, 5]], ['sch-illustration-board', 3, [1, 4]], ['sch-long-envelope', 3, [1, 3]],
    ['art-sketchbook', 4, [1, 2]], ['art-colored-pencils', 4, [1, 2]], ['art-oil-pastels', 3, [1, 2]], ['art-watercolor', 3, [1, 1]],
    ['art-brush-set', 2, [1, 1]], ['art-acrylic-set', 2, [1, 1]], ['art-canvas', 1, [1, 3]], ['prt-bond-a4', 3, [1, 1]], ['prt-bond-long', 3, [1, 1]], ['prt-photo-paper', 1, [1, 1]],
    ['sch-calculator', 1, [1, 1]], ['cus-shirt', 1, [1, 2]], ['cus-id-lace', 1, [1, 1]],
  ],
  parent: [
    ['sch-notebook', 4, [4, 12]], ['sch-mongol', 3, [2, 4]], ['sch-yellow-pad', 3, [2, 6]], ['sch-ballpens', 2, [1, 3]],
    ['art-acrylic-set', 2, [1, 1]], ['art-colored-pencils', 2, [1, 2]], ['art-canvas', 1, [1, 2]], ['sch-calculator', 1, [1, 1]],
    ['cus-mug', 3, [1, 12]], ['cus-tumbler', 2, [1, 4]], ['cus-shirt', 1, [2, 6]], ['spt-chess', 1, [1, 1]],
  ],
  teacher: [
    ['prt-bond-a4', 4, [1, 3]], ['prt-bond-long', 3, [1, 3]], ['prt-laminating', 2, [1, 1]], ['sch-cartolina', 3, [5, 20]],
    ['sch-illustration-board', 2, [5, 15]], ['prt-specialty', 3, [1, 4]], ['prt-sticker-paper', 2, [1, 4]],
    ['sch-long-envelope', 2, [10, 30]], ['cus-plaque', 2, [1, 6]], ['art-colored-pencils', 1, [1, 2]], ['prt-ink', 1, [1, 1]],
  ],
  business: [
    ['cus-mug', 4, [6, 30]], ['cus-keychain', 2, [20, 60]], ['cus-tarpaulin', 4, [1, 4]], ['cus-shirt', 3, [5, 20]],
    ['prt-sticker-paper', 3, [2, 10]], ['cus-tumbler', 2, [2, 10]], ['cus-pins', 2, [2, 6]], ['prt-bond-a4', 3, [1, 5]],
    ['prt-ink', 2, [1, 2]], ['cus-id-lace', 2, [10, 40]], ['cus-plaque', 1, [1, 5]], ['prt-bond-long', 2, [1, 4]],
  ],
  // Sari-sari store owners who resell school supplies.
  reseller: [
    ['sch-notebook', 5, [20, 60]], ['sch-mongol', 4, [10, 20]], ['sch-ballpens', 4, [5, 20]], ['sch-yellow-pad', 4, [10, 40]],
    ['sch-long-envelope', 3, [20, 50]], ['sch-cartolina', 3, [10, 30]], ['sch-illustration-board', 2, [10, 30]],
  ],
  team: [
    ['spt-basketball', 4, [1, 2]], ['spt-volleyball', 3, [1, 2]], ['spt-badminton', 2, [1, 2]], ['spt-shuttlecock', 2, [1, 3]],
    ['spt-pingpong', 1, [1, 2]], ['spt-jumprope', 1, [2, 6]], ['spt-chess', 1, [1, 2]], ['cus-jersey', 2, [10, 15]],
    ['cus-shirt', 1, [10, 20]], ['cus-tarpaulin', 1, [1, 2]],
  ],
};
const SEGMENT_OF_MONTH = (m) => [
  ['student', 4 * SEASON.school[m]],
  ['parent', 1.5 * ((SEASON.school[m] + SEASON.custom[m]) / 2)],
  ['teacher', 1.4 * SEASON.printing[m]],
  ['business', 2.6 * SEASON.custom[m]],
  ['reseller', 0.7 * SEASON.school[m]],
  ['team', 1.1 * SEASON.sports[m]],
];

const NOTES = {
  'cus-mug': ['Company logo, one color', 'Giveaways, names on the attached list', 'Christmas giveaways for the office', 'Birthday souvenirs, photo on one side'],
  'cus-shirt': ['Org shirts: front logo, back names', 'Family reunion shirts', 'Class shirts, section name on the back', 'Staff shirts with the shop logo'],
  'cus-jersey': ['Barangay league jerseys, names and numbers attached', 'Intramurals jerseys, team colors', 'Summer league jerseys'],
  'cus-tumbler': ['Names on each tumbler', 'Office anniversary giveaways'],
  'cus-tarpaulin': ['Birthday backdrop', 'Store opening announcement', 'Graduation backdrop, 4 × 6 ft', 'Fiesta schedule, 3 × 5 ft with eyelets', 'Recognition day tarpaulin'],
  'cus-id-lace': ['Seminar participant IDs', 'Company ID laces with logo'],
  'cus-pins': ['Event staff pins', 'Campaign pins for the student council'],
  'cus-keychain': ['Wedding giveaways', 'Resort souvenir keychains'],
  'cus-plaque': ['Recognition awards, names attached', 'Plaque of appreciation for a retiring teacher'],
};

// ------------------------------------------------------------------
// Customers
// ------------------------------------------------------------------
const FIRST = [
  'Angelica', 'Mark Anthony', 'Kyla', 'Joshua', 'Princess', 'John Paul', 'Bea', 'Carlo', 'Janelle', 'Ramon', 'Trisha', 'Aldrin',
  'Camille', 'Nico', 'Rhea', 'Jerome', 'Mika', 'Leo', 'Patricia', 'Ronnel', 'Shaira', 'Dennis', 'Hazel', 'Vince', 'Lorie',
  'Arnel', 'Jasmine', 'Christian', 'Mae', 'Rodel', 'Erika', 'Francis', 'Joanna', 'Emmanuel', 'Czarina', 'Gilbert', 'Ivy',
  'Marvin', 'Rowena', 'Kenneth', 'Althea', 'Dexter',
];
const LAST = [
  'Manalo', 'Bautista', 'Garcia', 'Ramirez', 'Torres', 'Castro', 'Navarro', 'Gonzales', 'Mercado', 'Aquino', 'Soriano',
  'Pascual', 'Dimaculangan', 'Hernandez', 'Lopez', 'Marasigan', 'Atienza', 'Umali', 'Panganiban', 'Magsino', 'Salazar',
  'Cabrera', 'De Leon', 'Ilagan', 'Rivera', 'Evangelista', 'Morales', 'Gutierrez', 'Leviste', 'Tolentino', 'Arellano',
];
const PLACES = [
  ['Brgy. Lalud, Calapan City', 8], ['Brgy. San Vicente South, Calapan City', 6], ['Brgy. Camilmil, Calapan City', 5],
  ['Brgy. Sta. Isabel, Calapan City', 4], ['Brgy. Ibaba East, Calapan City', 4], ['Brgy. Guinobatan, Calapan City', 3],
  ['Brgy. Lumangbayan, Calapan City', 3], ['Brgy. Tawiran, Calapan City', 3], ['Brgy. Bayanan I, Calapan City', 2],
  ['Brgy. Suqui, Calapan City', 2], ['Poblacion, Naujan, Oriental Mindoro', 3], ['Poblacion, Baco, Oriental Mindoro', 2],
  ['Poblacion, Victoria, Oriental Mindoro', 2], ['Poblacion, Pola, Oriental Mindoro', 1],
  ['Poblacion, Puerto Galera, Oriental Mindoro', 1], ['Poblacion, Socorro, Oriental Mindoro', 1],
];
const SEGMENTS = [['student', 44], ['parent', 16], ['teacher', 12], ['business', 17], ['team', 11]];
const ALL_SEGMENTS = [...SEGMENTS.map(([s]) => s), 'reseller'];

// The eight hand-written sample customers keep their character here too.
const KNOWN_SEGMENT = {
  'c-maria': 'teacher',
  'c-rafael': 'business',
  'c-kristine': 'student',
  'c-jomar': 'team',
  'c-liza': 'business',
  'c-paolo': 'student',
  'c-grace': 'parent',
  'c-nestor': 'reseller',
};

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');

function makeCustomers() {
  return FIRST.map((first, i) => {
    const last = LAST[(i * 7 + 3) % LAST.length];
    const prefix = pick(['0917', '0918', '0927', '0939', '0945', '0956', '0977', '0995']);
    return {
      id: `c-h${String(i + 1).padStart(2, '0')}`,
      role: 'customer',
      sample: true,
      fullName: `${first} ${last}`,
      email: `${slug(first)}.${slug(last)}@example.com`,
      contactNumber: `${prefix} ${between(100, 999)} ${between(1000, 9999)}`,
      address: weighted(PLACES),
      avatar: null,
      createdAt: null, // set when they first order
      segment: weighted(SEGMENTS),
      loyalty: weighted([[1, 6], [3, 3], [8, 1]]),
    };
  });
}

// ------------------------------------------------------------------
// Team members who move work along, by when they were on the team
// ------------------------------------------------------------------
function staffOn(daysAgo, digital = false) {
  const team = [['Ben Ramos', 3], ['Lorna Guhit', 1]];
  if (daysAgo < 420) team.push(['Mark Dizon', 4]);
  if (daysAgo > 64) team.push(['Rose Aquino', 3]);
  if (digital) return daysAgo < 150 ? weighted([['Joy Macaraig', 6], ['Lorna Guhit', 1]]) : 'Lorna Guhit';
  return weighted(team);
}

// ------------------------------------------------------------------
// Builders
// ------------------------------------------------------------------
const PRODUCT = Object.fromEntries(products.map((p) => [p.id, p]));

function basket(segment, month) {
  const picks = PICKS[segment].map(([id, w, qty]) => [[id, qty], w * SEASON[PRODUCT[id].category][month]]);
  const lines = 1 + (chance(0.45) ? 1 : 0) + (chance(0.15) ? 1 : 0);
  const chosen = new Map();
  for (let i = 0; i < lines * 3 && chosen.size < lines; i += 1) {
    const [id, [lo, hi]] = weighted(picks);
    if (!chosen.has(id)) chosen.set(id, between(lo, hi));
  }
  return [...chosen].map(([id, qty]) => ({
    productId: id,
    name: PRODUCT[id].name,
    price: PRODUCT[id].price,
    qty,
    image: PRODUCT[id].image,
    note: NOTES[id] ? pick(NOTES[id]) : '',
  }));
}

function orderHistory(createdMs, custom, fulfillment, ageDays) {
  const approved = createdMs + between(20, 200) * 60000;
  const started = approved + between(1, 18) * HOUR;
  const steps = [
    { status: 'pending', at: createdMs, note: 'Order placed online.' },
    { status: 'approved', at: approved, note: '', by: staffOn(ageDays) },
    { status: 'in_progress', at: started, note: '', by: staffOn(ageDays) },
  ];
  let last = started;
  if (custom) {
    last += between(18, 40) * HOUR;
    steps.push({ status: 'for_revision', at: last, note: 'Proof sent for approval.', by: staffOn(ageDays) });
    last += between(20, 72) * HOUR;
  } else {
    last += between(2, 20) * HOUR;
  }
  steps.push({
    status: 'completed',
    at: last,
    note: fulfillment === 'delivery' ? 'Delivered.' : 'Picked up at the counter.',
    by: staffOn(ageDays),
  });
  return steps.map((s) => ({ ...s, at: new Date(s.at).toISOString() }));
}

function buildOrders(now, customers) {
  const pool = Object.fromEntries(ALL_SEGMENTS.map((s) => [s, { fresh: [], known: [] }]));
  customers.forEach((c) => pool[c.segment][c.createdAt ? 'known' : 'fresh'].push(c));

  const customerFor = (segment, dayMs) => {
    const { fresh, known } = pool[segment];
    const eligible = known.filter((c) => new Date(c.createdAt).getTime() <= dayMs);
    if (fresh.length && (!eligible.length || chance(0.33))) {
      const c = fresh.shift();
      c.createdAt = new Date(dayMs - between(0, 12) * DAY - between(1, 20) * HOUR).toISOString();
      known.push(c);
      return c;
    }
    if (!eligible.length) return null;
    return weighted(eligible.map((c) => [c, c.loyalty]));
  };

  const orders = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (let ago = OLDEST_DAYS_AGO; ago >= NEWEST_DAYS_AGO; ago -= 1) {
    const dayMs = today.getTime() - ago * DAY;
    const day = new Date(dayMs);
    const month = day.getMonth();
    const growth = 0.5 + 0.7 * (1 - (ago - NEWEST_DAYS_AGO) / (OLDEST_DAYS_AGO - NEWEST_DAYS_AGO));
    const count = poisson(0.8 * MONTH_BUSY[month] * WEEKDAY_BUSY[day.getDay()] * growth);
    const times = Array.from({ length: count }, () => dayMs + weighted(ORDER_HOURS) * HOUR + between(0, 59) * 60000).sort((a, b) => a - b);
    for (const createdMs of times) {
      const segment = weighted(SEGMENT_OF_MONTH(month));
      const c = customerFor(segment, dayMs);
      if (!c) continue;
      const items = basket(segment, month);
      const custom = items.some((i) => PRODUCT[i.productId].category === 'custom');
      const bulky = segment === 'business' || segment === 'team';
      const fulfillment = chance(bulky ? 0.45 : 0.2) ? 'delivery' : 'pickup';
      const gcashShare = 0.3 + 0.18 * growth;
      const payment = weighted([['gcash', gcashShare], ['maya', 0.1], ['cash', 0.9 - gcashShare]]);
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0;
      orders.push([
        c.id,
        {
          kind: 'order',
          createdAt: new Date(createdMs).toISOString(),
          items,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          fulfillment,
          payment,
          contact: { name: c.fullName, phone: c.contactNumber, address: fulfillment === 'delivery' ? c.address : '' },
          status: 'completed',
          history: orderHistory(createdMs, custom, fulfillment, ago),
        },
      ]);
    }
  }
  const first = LAST_ORDER_NO - orders.length + 1;
  orders.forEach(([, o], i) => (o.ref = `GAC-ORD-${String(first + i).padStart(5, '0')}`));
  return orders;
}

// ------------------------------------------------------------------
// Digital Help Hub requests
// ------------------------------------------------------------------
const SERVICE_MIX = [
  ['resume', 20], ['powerpoint', 18], ['pubmat', 17], ['invitation', 11], ['infographic', 8], ['qr', 6],
  ['portfolio', 6], ['printing', 6], ['website', 3], ['custom', 5],
];
const SERVICE_SEASON = {
  resume: [1, 1, 1.8, 1.8, 1.3, 1, 1, 1, 1, 1, 1, 0.8],
  powerpoint: [1, 1, 1.5, 0.8, 0.6, 0.8, 1, 1.1, 1.2, 1.5, 1.4, 0.8],
  invitation: [1, 1.5, 1.1, 1, 1.2, 1, 1, 1, 1, 1, 1.2, 1.6],
  pubmat: [1, 1, 1, 1.1, 1.5, 1, 1, 1.2, 1.1, 1.5, 1, 1.2],
};
const WHO_REQUESTS = {
  resume: [['student', 1]],
  portfolio: [['student', 1]],
  powerpoint: [['student', 5], ['teacher', 1]],
  printing: [['student', 3], ['teacher', 1]],
  infographic: [['teacher', 1], ['student', 1]],
  invitation: [['parent', 3], ['student', 1]],
  pubmat: [['student', 3], ['business', 2], ['team', 1]],
  qr: [['business', 3], ['teacher', 1]],
  website: [['business', 1]],
  custom: [['business', 2], ['student', 1]],
};
const LEAD_DAYS = { resume: 2, qr: 1, pubmat: 2, powerpoint: 3, infographic: 3, invitation: 3, portfolio: 5, printing: 1, website: 12, custom: 5 };
const TITLES = {
  resume: ['Resume for OJT application', 'Resume for first job', 'CV for scholarship application', 'Resume for a BPO application', 'Resume for a teaching position'],
  powerpoint: ['Thesis defense slides', 'Research proposal deck', 'Report slides for Filipino class', 'Capstone project presentation', 'Seminar slides for the barangay'],
  pubmat: ['Intramurals pubmat', 'Fiesta schedule pubmat', 'Org recruitment poster', 'Basketball league poster', 'Seminar announcement'],
  invitation: ['Debut invitation', 'Wedding e-invitation', 'Baptism invitation', 'Birthday party invitation', 'Class reunion invitation'],
  infographic: ['Classroom health infographic', 'Disaster preparedness infographic', 'Nutrition Month infographic', 'Barangay clean-up infographic'],
  qr: ['QR code for GCash payments', 'Menu QR code', 'QR code for a Google Form', 'QR code for event registration'],
  portfolio: ['Architecture application portfolio', 'Photography portfolio', 'Fine arts portfolio', 'Graphic design portfolio'],
  printing: ['Print and bind research paper', 'Print thesis copies', 'Print certificates', 'Print photos for a school project'],
  website: ['Resort one-page website', 'Online store page', 'Clinic information website'],
  custom: ['Logo for a small business', 'Org logo redesign', 'Menu board design', 'Product label design'],
};
const DESCRIPTIONS = {
  resume: 'One-page resume. My details are in the attached file.',
  powerpoint: 'Clean, readable slides. The content is final in our Word file.',
  pubmat: 'Facebook pubmat in square and story sizes.',
  invitation: 'Digital invitation for Messenger, with a printable version.',
  infographic: 'A4 infographic for printing and posting.',
  qr: 'QR code with our logo in the middle.',
  portfolio: 'PDF portfolio of my work for an application.',
  printing: 'Print our finished files. Soft copy is attached.',
  website: 'One-page website with photos, map, and contact details.',
  custom: 'Design work. Details and references are in the brief.',
};
const FILE_EXT = { resume: 'pdf', powerpoint: 'pptx', pubmat: 'png', invitation: 'png', infographic: 'pdf', qr: 'png', portfolio: 'pdf', printing: 'pdf', website: 'zip', custom: 'png' };

function priceFor(serviceId) {
  if (serviceId === 'website') return between(3, 10) * 500;
  if (serviceId === 'printing') return roundTo(between(120, 600), 10);
  if (serviceId === 'custom') return roundTo(between(400, 1500), 50);
  const base = getDigitalService(serviceId).startingPrice;
  return roundTo(base * weighted([[1, 4], [1.34, 2], [1.67, 2], [2, 1.5], [3, 0.5]]), serviceId === 'qr' ? 10 : 50);
}

function buildProjects(now, customers) {
  const bySegment = (segment, atMs) => {
    const list = customers.filter((c) => c.segment === segment && c.createdAt && new Date(c.createdAt).getTime() <= atMs);
    return list.length ? weighted(list.map((c) => [c, c.loyalty])) : null;
  };
  const span = HUB_OPENED_DAYS_AGO - NEWEST_DAYS_AGO;
  // Demand grows after the launch: requests per day rise steadily, ending
  // RAMP times busier than the first weeks (sampled from that linear ramp).
  const RAMP = 3;
  const created = Array.from({ length: PROJECT_COUNT }, () => {
    const x = (-1 + Math.sqrt(1 + (RAMP - 1) * (RAMP + 1) * rand())) / (RAMP - 1);
    const ago = HUB_OPENED_DAYS_AGO - x * span;
    const day = new Date(now - ago * DAY);
    day.setHours(0, 0, 0, 0);
    return day.getTime() + weighted(EVENING_HOURS) * HOUR + between(0, 59) * 60000;
  }).sort((a, b) => a - b);

  const projects = [];
  for (const createdMs of created) {
    const ageDays = (now - createdMs) / DAY;
    const month = new Date(createdMs).getMonth();
    const serviceId = weighted(SERVICE_MIX.map(([id, w]) => [id, w * (SERVICE_SEASON[id]?.[month] ?? 1)]));
    let c = null;
    for (let tries = 0; tries < 4 && !c; tries += 1) c = bySegment(weighted(WHO_REQUESTS[serviceId]), createdMs);
    c ??= bySegment('student', createdMs) ?? customers.find((x) => x.createdAt);
    const service = getDigitalService(serviceId);
    const rush = serviceId !== 'website' && chance(0.1);
    let price = priceFor(serviceId);
    if (rush) price += rushFeeFor(price) ?? 100;
    const budget = roundTo(price * (0.85 + rand() * 0.65), 50);
    const lead = LEAD_DAYS[serviceId];
    const deadlineMs = createdMs + (rush ? 1 : lead + between(0, 4)) * DAY;
    const revisions = weighted([[0, 45], [1, 40], [2, 15]]);
    const approved = createdMs + between(1, 8) * HOUR;
    const started = approved + between(1, 14) * HOUR;
    const workDays = rush ? 0.6 + rand() * 0.5 : lead * (0.55 + rand() * 0.75);
    const draft = started + workDays * 0.7 * DAY;
    const done = draft + (0.3 + revisions * 0.45) * DAY;
    const by = staffOn(ageDays, true);
    const quoted = !service.startingPrice || price !== service.startingPrice;
    projects.push([
      c.id,
      {
        kind: 'project',
        createdAt: new Date(createdMs).toISOString(),
        serviceId,
        serviceName: service.name,
        customerName: c.fullName,
        title: pick(TITLES[serviceId]),
        description: DESCRIPTIONS[serviceId],
        instructions: '',
        rush,
        budget,
        price,
        revisions,
        files: [],
        deliverables: [
          {
            name: `${pick(TITLES[serviceId]).replace(/[^A-Za-z0-9]+/g, '-')}-Final.${FILE_EXT[serviceId]}`,
            size: between(80, 4200) * 1024,
            kind: 'final',
            at: new Date(done).toISOString(),
          },
        ],
        deadline: localDate(deadlineMs),
        status: 'completed',
        history: [
          { status: 'pending', at: createdMs, note: 'Request submitted online.' },
          { status: 'approved', at: approved, note: quoted ? `Quoted at ₱${price.toLocaleString('en-PH')}.` : '', by },
          { status: 'in_progress', at: started, note: '', by },
          { status: 'for_revision', at: draft, note: revisions ? `Draft sent. ${revisions} round${revisions > 1 ? 's' : ''} of changes.` : 'Draft sent.', by },
          { status: 'completed', at: done, note: 'Final files sent.', by },
        ].map((h) => ({ ...h, at: new Date(h.at).toISOString() })),
      },
    ]);
  }
  projects.forEach(([, p], i) => (p.ref = `GAC-DIG-${String(i + 1).padStart(5, '0')}`));
  return projects;
}

// ------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------
// `knownCustomers` are the hand-written sample customers; they get older
// orders too, but only after the date they signed up.
export function buildHistory(knownCustomers, now = Date.now()) {
  const extra = makeCustomers();
  const all = [
    ...knownCustomers.map((c) => ({ ...c, segment: KNOWN_SEGMENT[c.id] ?? 'student', loyalty: 6 })),
    ...extra,
  ];
  const orders = buildOrders(now, all);
  const projects = buildProjects(now, all);
  // Customers who never ordered still have an account: they signed up and browsed.
  const customers = extra.map(({ segment: _s, loyalty: _l, ...c }) => ({
    ...c,
    createdAt: c.createdAt ?? new Date(now - between(35, 300) * DAY).toISOString(),
  }));
  return { customers, orders, projects };
}

