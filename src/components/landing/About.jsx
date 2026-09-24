import CropFrame from '../brand/CropFrame';
import CountUp from '../fx/CountUp';
import { milestones, yearsInService } from '../../data/business';
import { photoUrl } from '../../utils/images';

export default function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container about__grid">
        <div className="about__story" data-reveal>
          <h2 id="about-title" className="h2">
            <CountUp to={yearsInService()} duration={1600} /> Years of Creativity and Service
          </h2>
          <p className="lede">
            Guhit Arts Center started around 1979 as a small art service shop in Calapan, painting signs and lettering
            by hand. <em>Guhit</em> means line, and every job still starts with one.
          </p>
          <p>
            As the city grew, so did the shop. Printing came in-house, then customized shirts, mugs, and jerseys, then
            school and sporting goods. Today students, teachers, teams, and small businesses from around Oriental
            Mindoro come to one counter for all of it.
          </p>
          <CropFrame as="figure" className="about__photo">
            <img src={photoUrl('about')} alt="Jars of well-used paint brushes on a studio table" loading="lazy" />
          </CropFrame>
        </div>

        <ol className="milestones" role="list" aria-label="How the shop grew" data-reveal>
          {milestones.map((m, i) => (
            <li key={m.title} className={`milestone ${m.when === 'Next' ? 'milestone--next' : ''}`} style={{ '--i': i }}>
              <p className="milestone__when">{m.when}</p>
              <h3 className="h4">{m.title}</h3>
              <p className="muted">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
