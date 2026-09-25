// Options for the landing page's design studio.
import { CircleDot, Coffee, Flag, Shirt } from 'lucide-react';

const WHITE = { id: 'white', label: 'White', fill: '#ffffff', edge: '#d3d8e1' };
const BLACK = { id: 'black', label: 'Black', fill: '#26272d', edge: '#111216', dark: true };

// `area` is the print area in the 480 × 360 drawing. The mug wraps its print
// around a cylinder (`wrap`); everything else prints flat.
export const ITEMS = [
  {
    id: 'mug',
    productId: 'cus-mug',
    label: 'Mug',
    icon: Coffee,
    unit: ['mug', 'mugs'],
    area: { x: 212, y: 192, w: 176, h: 150 },
    wrap: { cx: 212, r: 112, k: 11 },
    colors: [WHITE, BLACK],
  },
  {
    id: 'shirt',
    productId: 'cus-shirt',
    label: 'Shirt',
    icon: Shirt,
    unit: ['shirt', 'shirts'],
    area: { x: 240, y: 176, w: 128, h: 112 },
    colors: [
      WHITE,
      BLACK,
      { id: 'ash', label: 'Ash gray', fill: '#c9ccd3', edge: '#a9aeb8' },
      { id: 'maroon', label: 'Maroon', fill: '#7a1f2b', edge: '#561520', dark: true },
    ],
  },
  {
    id: 'pin',
    productId: 'cus-pins',
    label: 'Button pin',
    icon: CircleDot,
    unit: ['set of 10', 'sets of 10'],
    area: { x: 240, y: 180, w: 172, h: 150 },
    colors: [WHITE, { id: 'yellow', label: 'Yellow', fill: '#ffd60a', edge: '#d9b400' }, BLACK],
  },
  {
    id: 'tarp',
    productId: 'cus-tarpaulin',
    label: 'Tarpaulin',
    icon: Flag,
    unit: ['tarpaulin', 'tarpaulins'],
    area: { x: 240, y: 186, w: 320, h: 150 },
    colors: [WHITE],
  },
];

export const INKS = [
  { id: 'magenta', label: 'Magenta', color: '#e4007c' },
  { id: 'cyan', label: 'Cyan', color: '#009fe3' },
  { id: 'yellow', label: 'Yellow', color: '#ffd60a' },
  { id: 'ink', label: 'Indigo', color: '#1c2054' },
  { id: 'white', label: 'White', color: '#ffffff' },
];

export const LOOKS = [
  { id: 'bold', label: 'Bold' },
  { id: 'hand', label: 'Hand-lettered' },
  { id: 'outline', label: 'Outline' },
];

export const EXAMPLES = [
  { main: 'Lalud Warriors', sub: 'Barangay League 2026', item: 'shirt', color: 'black', ink: 'yellow', look: 'bold', qty: 15 },
  { main: 'Bea turns 18', sub: 'November 15, 2026', item: 'mug', color: 'white', ink: 'magenta', look: 'hand', qty: 30 },
  { main: 'Vote Kyla', sub: 'SSG President', item: 'pin', color: 'yellow', ink: 'ink', look: 'bold', qty: 5 },
  { main: 'Happy 60th, Lola Nena!', sub: 'Love, your apos', item: 'tarp', color: 'white', ink: 'cyan', look: 'hand', qty: 1 },
  { main: 'BSIT 4-A', sub: 'Class of 2026', item: 'mug', color: 'black', ink: 'white', look: 'outline', qty: 40 },
];
