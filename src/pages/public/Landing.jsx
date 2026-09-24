import { Link } from 'react-router-dom';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import RegMark from '../../components/brand/RegMark';
import Ticker from '../../components/fx/Ticker';
import Hero from '../../components/landing/Hero';
import Services from '../../components/landing/Services';
import FeaturedProducts from '../../components/landing/FeaturedProducts';
import DigitalHubTeaser from '../../components/landing/DigitalHubTeaser';
import About from '../../components/landing/About';
import Contact from '../../components/landing/Contact';

export default function Landing() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="scroll-progress" aria-hidden="true" />
      <PublicHeader />
      <main id="main">
        <Hero />
        <Ticker />
        <Services />
        <FeaturedProducts />
        <DigitalHubTeaser />
        <About />
        <Contact />
        <section className="closing" aria-labelledby="closing-title">
          <RegMark size={420} className="closing__mark" />
          <div className="container closing__inner" data-reveal>
            <h2 id="closing-title" className="h2">
              Have an idea? Bring it in, or send it online.
            </h2>
            <div className="closing__actions">
              <Link to="/signup" className="btn btn--light btn--lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn--outline-light btn--lg">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
