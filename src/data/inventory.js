// Starting stock on the shop shelves. Customized products are made to order,
// so they have no stock count. A few items start low or out of stock so the
// admin panel's alerts have something to show.
export const LOW_STOCK_AT = 5;

export const INITIAL_STOCK = {
  'art-colored-pencils': 42,
  'art-oil-pastels': 36,
  'art-acrylic-set': 18,
  'art-brush-set': 25,
  'art-sketchbook': 30,
  'art-watercolor': 14,
  'art-canvas': 3,
  'sch-mongol': 150,
  'sch-notebook': 220,
  'sch-yellow-pad': 180,
  'sch-ballpens': 90,
  'sch-calculator': 4,
  'sch-cartolina': 300,
  'sch-illustration-board': 75,
  'sch-long-envelope': 120,
  'prt-bond-long': 48,
  'prt-bond-a4': 36,
  'prt-photo-paper': 22,
  'prt-sticker-paper': 40,
  'prt-ink': 0,
  'prt-laminating': 9,
  'prt-specialty': 26,
  'spt-basketball': 8,
  'spt-volleyball': 2,
  'spt-badminton': 6,
  'spt-shuttlecock': 11,
  'spt-pingpong': 7,
  'spt-chess': 12,
  'spt-jumprope': 24,
};

export const stockLevel = (stock) => {
  if (stock === null || stock === undefined) return 'made';
  if (stock <= 0) return 'out';
  if (stock <= LOW_STOCK_AT) return 'low';
  return 'ok';
};
