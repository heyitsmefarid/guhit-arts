// Shop hours (placeholder schedule from data/business.js), as minutes from midnight.
const SCHEDULE = {
  0: [9 * 60, 12 * 60], // Sunday
  default: [8 * 60, 18 * 60], // Monday to Saturday
};

const fmt = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 12 && m === 0) return '12:00 NN';
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

const hoursFor = (day) => SCHEDULE[day] ?? SCHEDULE.default;

export function openStatus(date = new Date()) {
  const day = date.getDay();
  const mins = date.getHours() * 60 + date.getMinutes();
  const [open, close] = hoursFor(day);
  if (mins >= open && mins < close) return { open: true, text: `Open now until ${fmt(close)}` };
  if (mins < open) return { open: false, text: `Closed now. Opens today at ${fmt(open)}` };
  const [nextOpen] = hoursFor((day + 1) % 7);
  return { open: false, text: `Closed now. Opens tomorrow at ${fmt(nextOpen)}` };
}
