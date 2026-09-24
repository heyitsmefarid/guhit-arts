import { Link } from 'react-router-dom';
import { divisions } from '../../data/business';
import { photoUrl } from '../../utils/images';

export default function Services() {
  return (
    <section id="services" className="section services" aria-labelledby="services-title">
      <div className="container">
        <header className="section-head" data-reveal>
          <h2 id="services-title" className="h2">
            Our Services
          </h2>
          <p className="lede">
            Walk in with a sketch, a file, or just an idea. One team handles the printing, the artwork, the custom
            goods, and the sports gear, so you only explain it once.
          </p>
        </header>

        <div className="divisions">
          {divisions.map((d) => (
            <article key={d.id} className="division" data-ink={d.ink} data-reveal>
              <div className="division__media">
                <img src={photoUrl(d.image)} alt="" loading="lazy" />
              </div>
              <div className="division__body">
                <h3 className="division__title">
                  <span className="division__plate" aria-hidden="true" />
                  {d.name}
                </h3>
                <p className="division__summary">{d.summary}</p>
                <ul className="division__list" role="list">
                  {d.offerings.map((o, i) => (
                    <li key={o} style={{ '--i': i }}>
                      {o}
                    </li>
                  ))}
                </ul>
                <Link to={`/login?next=${encodeURIComponent(`/app/shop?category=${d.shopCategory}`)}`} className="division__link">
                  Shop {d.name.toLowerCase()}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
