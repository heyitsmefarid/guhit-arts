import { PenLine } from 'lucide-react';

// "What stands out": the report's numbers written as plain sentences.
export default function Findings({ items, title = 'What stands out' }) {
  return (
    <section className="findings" aria-labelledby="findings-h">
      <h2 id="findings-h" className="findings__title">
        <PenLine size={18} aria-hidden="true" />
        {title}
      </h2>
      <ul className="findings__list" role="list">
        {items.map((text, i) => (
          <li key={i} style={{ '--i': i }}>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
