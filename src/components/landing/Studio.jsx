import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Printer, RotateCcw, Shuffle, X } from 'lucide-react';
import QuantityStepper from '../ui/QuantityStepper';
import { products } from '../../data/products';
import { formatPeso } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/motion';
import ProofStage from './studio/ProofStage';
import { resetLetterWidths } from './studio/Artwork';
import { EXAMPLES, INKS, ITEMS, LOOKS } from './studio/data';

// "Try your idea on something real": type a line (or add a logo), pick a
// product, a color, an ink, and a lettering style, and run it through the
// press. The design starts as a pencil sketch (the idea), goes through a
// press run (C, M, Y plates, then an ink roller), and comes out stamped
// "Printed". The printed mug can be turned to see the print wrap around it.
const PRINT_MS = 2000;
const MAX_LOGO_BYTES = 3 * 1024 * 1024;

export default function Studio() {
  const [main, setMain] = useState('BSIT 4-A');
  const [sub, setSub] = useState('Class of 2026');
  const [itemId, setItemId] = useState('mug');
  const [colorId, setColorId] = useState('white');
  const [ink, setInk] = useState('magenta');
  const [look, setLook] = useState('bold');
  const [logo, setLogo] = useState(null); // { src, name }
  const [logoError, setLogoError] = useState('');
  const [qty, setQty] = useState(12);
  const [example, setExample] = useState(0);
  const [stage, setStage] = useState('sketch'); // sketch → printing → printed
  const [prints, setPrints] = useState(0);
  const [drawKey, setDrawKey] = useState(0);
  const [, setFontsReady] = useState(false);
  const timer = useRef(null);
  const proof = useRef(null);

  const item = ITEMS.find((i) => i.id === itemId);
  const color = item.colors.find((c) => c.id === colorId) ?? item.colors[0];
  const inkInfo = INKS.find((i) => i.id === ink);
  const product = products.find((p) => p.id === item.productId);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Letter widths for the mug's wrapped print are measured on a canvas, so
  // measure again once the web fonts have loaded.
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => {
      if (!live) return;
      resetLetterWidths();
      setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  // The pencil sketches the design again once typing pauses.
  const signature = `${main}|${sub}|${itemId}|${look}|${logo?.name ?? ''}`;
  useEffect(() => {
    const t = setTimeout(() => setDrawKey((k) => k + 1), 450);
    return () => clearTimeout(t);
  }, [signature]);

  const toSketch = () => {
    clearTimeout(timer.current);
    setStage('sketch');
  };
  // Any change to the design takes it back to a sketch.
  const change = (setter) => (value) => {
    setter(value);
    toSketch();
  };

  // White ink only prints on dark products; indigo barely shows on them.
  const fitInk = (nextColor, current) => {
    if (nextColor.dark && current === 'ink') return 'white';
    if (!nextColor.dark && current === 'white') return 'magenta';
    return current;
  };
  const pickItem = (id) => {
    const next = ITEMS.find((i) => i.id === id);
    const nextColor = next.colors.find((c) => c.id === colorId) ?? next.colors[0];
    setItemId(id);
    setColorId(nextColor.id);
    setInk((cur) => fitInk(nextColor, cur));
    toSketch();
  };
  const pickColor = (c) => {
    setColorId(c.id);
    setInk((cur) => fitInk(c, cur));
    toSketch();
  };

  const finish = () => {
    setStage('printed');
    setPrints((n) => n + 1);
  };
  const print = () => {
    clearTimeout(timer.current);
    // On phones the form sits under the preview; bring the preview into view.
    proof.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setStage('printing');
    timer.current = setTimeout(finish, PRINT_MS);
  };

  const tryExample = () => {
    const e = EXAMPLES[example % EXAMPLES.length];
    setExample((n) => n + 1);
    setMain(e.main);
    setSub(e.sub);
    setItemId(e.item);
    setColorId(e.color);
    setInk(e.ink);
    setLook(e.look);
    setQty(e.qty);
    print();
  };

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Choose an image file, like a PNG or JPG.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('That image is over 3 MB. Choose a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo({ src: reader.result, name: file.name });
      setLogoError('');
      toSketch();
    };
    reader.readAsDataURL(file);
  };

  const words = [main.trim(), sub.trim()].filter(Boolean);
  const lookLabel = LOOKS.find((s) => s.id === look).label.toLowerCase();
  const note = `${words.length ? `Print "${words.join('" and "')}"` : 'Print my logo'}, in ${inkInfo.label.toLowerCase()} ink, ${lookLabel} lettering, on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}.${logo ? ' I will attach my logo.' : ''} Designed on the website.`;
  const orderLink = `/login?next=${encodeURIComponent(`/app/shop/${item.productId}?qty=${qty}&design=${encodeURIComponent(note)}`)}`;
  const ready = /same day/i.test(product.leadTime) ? 'Ready the same day' : `Ready in ${product.leadTime}`;
  const art = { item, main: main.trim(), sub: sub.trim(), logo: logo?.src, look };
  const status = {
    sketch: 'Sketch. This is still an idea.',
    printing: 'Printing: cyan, magenta, and yellow plates, then the ink roller.',
    printed: `Printed on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}.${item.wrap ? ' Drag the mug to turn it.' : ''}`,
  }[stage];

  return (
    <section id="studio" className="section studio" aria-labelledby="studio-title">
      <div className="container studio__grid">
        <div className="studio__copy" data-reveal>
          <h2 id="studio-title" className="h2">
            Try your idea on something real
          </h2>
          <p className="lede">
            Type your words or add a logo, pick what to print it on, and press print. We make the real one at the
            counter, usually in a day or two.
          </p>
        </div>

        <div className="studio__stage" data-reveal>
          <ProofStage
            key={prints}
            ref={proof}
            item={item}
            color={color}
            ink={inkInfo}
            art={art}
            stage={stage}
            keyline={ink === 'yellow' && !color.dark && look !== 'outline'}
            drawKey={drawKey}
            prints={prints}
            label={`Preview: ${words.join(', ') || 'your logo'} on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}, ${
              stage === 'sketch' ? 'as a pencil sketch' : `printed in ${inkInfo.label.toLowerCase()} ink`
            }`}
          />
          <p className="studio__status" role="status">
            {status}
          </p>
        </div>

        <form
          className="slip"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            print();
          }}
        >
          <div className="slip__words">
            <div className="field">
              <label htmlFor="studio-main">Big text</label>
              <input id="studio-main" className="input" maxLength={24} value={main} onChange={(e) => change(setMain)(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="studio-sub">Small text</label>
              <input id="studio-sub" className="input" maxLength={28} value={sub} onChange={(e) => change(setSub)(e.target.value)} />
            </div>
            <button type="button" className="slip__example" onClick={tryExample}>
              <Shuffle size={15} aria-hidden="true" /> Try an example
            </button>
          </div>

          <fieldset className="slip__group">
            <legend>Print it on</legend>
            <div className="slip__tiles">
              {ITEMS.map((i) => (
                <label key={i.id} className="slip__tile">
                  <input type="radio" name="studio-item" value={i.id} checked={itemId === i.id} onChange={() => pickItem(i.id)} />
                  <span>
                    <i.icon size={22} strokeWidth={1.7} aria-hidden="true" />
                    {i.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="slip__pair">
            <fieldset className="slip__group">
              <legend>
                Color <span className="slip__picked">{color.label}</span>
              </legend>
              <div className="slip__swatches">
                {item.colors.map((c) => (
                  <label key={c.id} className="slip__swatch" title={c.label}>
                    <input type="radio" name="studio-color" value={c.id} checked={color.id === c.id} onChange={() => pickColor(c)} />
                    <span style={{ background: c.fill }}>
                      <span className="sr-only">{c.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="slip__group">
              <legend>
                Ink <span className="slip__picked">{inkInfo.label}</span>
              </legend>
              <div className="slip__swatches">
                {INKS.map((i) => {
                  const off = i.id === 'white' && !color.dark;
                  return (
                    <label key={i.id} className={`slip__swatch ${off ? 'is-off' : ''}`} title={off ? 'White ink needs a dark product' : i.label}>
                      <input type="radio" name="studio-ink" value={i.id} checked={ink === i.id} disabled={off} onChange={() => change(setInk)(i.id)} />
                      <span style={{ background: i.color }}>
                        <span className="sr-only">
                          {i.label}
                          {off ? ', needs a dark product' : ''}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <fieldset className="slip__group">
            <legend>Lettering</legend>
            <div className="slip__looks">
              {LOOKS.map((s) => (
                <label key={s.id} className={`slip__look slip__look--${s.id}`}>
                  <input type="radio" name="studio-look" value={s.id} checked={look === s.id} onChange={() => change(setLook)(s.id)} />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="slip__pair">
            <div className="slip__group">
              <span className="slip__label">Logo or photo</span>
              {logo ? (
                <p className="slip__file">
                  <img src={logo.src} alt="" />
                  <span>{logo.name}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setLogo(null);
                      toSketch();
                    }}
                    aria-label={`Remove ${logo.name}`}
                  >
                    <X size={16} />
                  </button>
                </p>
              ) : (
                <label className="btn btn--ghost btn--sm slip__upload">
                  <ImagePlus size={16} aria-hidden="true" /> Add an image
                  <input type="file" accept="image/*" onChange={onLogo} />
                </label>
              )}
              {logoError && (
                <p className="slip__error" role="alert">
                  {logoError}
                </p>
              )}
            </div>
            <div className="slip__group">
              <span className="slip__label">Quantity</span>
              <QuantityStepper value={qty} onChange={setQty} max={99} label={`How many ${item.unit[1]}`} />
            </div>
          </div>

          <div className="slip__foot">
            <p className="slip__estimate">
              <span className="slip__math num">
                {qty} {item.unit[qty === 1 ? 0 : 1]} × {formatPeso(product.price)}
              </span>
              <strong className="num" key={qty * product.price}>
                {formatPeso(qty * product.price)}
              </strong>
              <span className="slip__ready">Estimate. {ready}.</span>
            </p>
            <div className="slip__actions">
              <button type="submit" className="btn btn--primary slip__print" disabled={stage === 'printing'}>
                <Printer size={18} aria-hidden="true" />
                {stage === 'printed' ? 'Print again' : stage === 'printing' ? 'Printing…' : 'Print it'}
              </button>
              <Link to={orderLink} className={`btn ${stage === 'printed' ? 'btn--ink' : 'btn--ghost'}`}>
                Order this design
              </Link>
              {stage === 'printed' && (
                <button type="button" className="icon-btn slip__back" onClick={toSketch} aria-label="Back to sketch" title="Back to sketch">
                  <RotateCcw size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            {logo && <p className="slip__note">Attach the same image again when you order. It stays on this page only.</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
