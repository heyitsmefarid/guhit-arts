import { Link } from 'react-router-dom';
import { divisions } from '../../data/business';
import { photoUrl } from '../../utils/images';

// Each division is one of the four process inks, shown the way a print shop
// sees a photo before it is printed: as a single-ink separation. The full-color
// print feeds down over it; hovering a plate lifts the print to show the ink.
const PLATE = {
  cyan: { letter: 'C', name: 'Cyan plate' },
  magenta: { letter: 'M', name: 'Magenta plate' },
  yellow: { letter: 'Y', name: 'Yellow plate' },
  ink: { letter: 'K', name: 'Key plate' },
};

export default function Services() {
  return (
    <section id="services" className="section services" aria-labelledby="services-title">
      <div className="container">
        <header className="section-head section-head--row" data-reveal>
          <div>
            <h2 id="services-title" className="h2">
              Our Services
            </h2>
            <p className="lede">
              Every full-color print is four inks laid one over another: cyan, magenta, yellow, and key. The shop works
              the same way. Four divisions share one counter, so you only explain your idea once.
            </p>
          </div>
          <p className="plates__hint hand" aria-hidden="true">
            hover a photo to see its ink plate
          </p>
        </header>

        <ol className="plates" role="list" data-reveal>
          {divisions.map((d, i) => (
            <li key={d.id} className="plate" data-ink={d.ink} style={{ '--i': i }}>
              <div className="plate__media">
                <img className="plate__sep" src={photoUrl(d.image)} alt="" loading="lazy" />
                <img className="plate__color" src={photoUrl(d.image)} alt="" loading="lazy" />
                <span className="plate__letter" aria-hidden="true">
                  {PLATE[d.ink].letter}
                </span>
                <span className="plate__name hand" aria-hidden="true">
                  {PLATE[d.ink].name}
                </span>
              </div>
              <h3 className="plate__title">{d.name}</h3>
              <p className="plate__summary">{d.summary}</p>
              <ul className="plate__list" role="list">
                {d.offerings.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <Link to={`/login?next=${encodeURIComponent(`/app/shop?category=${d.shopCategory}`)}`} className="plate__link">
                Shop {d.name.toLowerCase()}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
