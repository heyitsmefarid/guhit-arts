// Simple social glyphs (Lucide no longer ships brand icons).
export default function SocialIcon({ id, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true' };
  if (id === 'facebook') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
      </svg>
    );
  }
  if (id === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="M12 3.5c-4.9 0-8.5 3.5-8.5 8 0 2.4 1 4.5 2.8 5.9v3.1l2.9-1.6c.9.3 1.8.4 2.8.4 4.9 0 8.5-3.5 8.5-7.8s-3.6-8-8.5-8z" />
      <path d="m7.5 13.8 3-3.2 2 2 3.5-2.8-3 3.3-2-2-3.5 2.7z" fill="currentColor" />
    </svg>
  );
}
