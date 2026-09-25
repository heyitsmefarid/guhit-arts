import { forwardRef, useEffect, useRef, useState } from 'react';
import CropFrame from '../../brand/CropFrame';
import Confetti from '../../fx/Confetti';
import { prefersReducedMotion } from '../../../utils/motion';
import Artwork from './Artwork';
import Mockup, { Defs, RevealClip, Roller } from './Mockup';

const PLATES = ['c', 'm', 'y'];
const SWAY = 0.42; // radians the printed mug turns each way while idle
const SWAY_MS = 6400;
const toDegrees = (rad) => Math.round((((rad * 180) / Math.PI + 540) % 360) - 180);

// The proof: the product drawing with the design on it, in three stages:
// a pencil sketch, the press run, and the printed product. It remounts for
// each finished print (keyed by the print count), so the stamp and confetti
// play once and the mug starts facing front.
const ProofStage = forwardRef(function ProofStage({ item, color, ink, art, stage, keyline, drawKey, prints, label }, ref) {
  const [rot, setRot] = useState(0);
  const [turned, setTurned] = useState(false); // the visitor took over from the idle sway
  const drag = useRef(null);
  const svg = useRef(null);
  const frame = useRef(null);
  const turnable = item.wrap && stage === 'printed';

  // Idle sway: the finished mug turns gently to show that the print wraps around it.
  useEffect(() => {
    if (!turnable || turned || prefersReducedMotion()) return undefined;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      setRot(SWAY * Math.sin(((now - start) / SWAY_MS) * Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [turnable, turned]);

  const onPointerDown = (e) => {
    if (!turnable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, rot };
    setTurned(true);
    frame.current?.classList.add('is-dragging');
  };
  const onPointerMove = (e) => {
    if (drag.current) {
      const scale = svg.current.getBoundingClientRect().width / 480;
      setRot(drag.current.rot + (e.clientX - drag.current.x) / scale / item.wrap.r);
      return;
    }
    // Tilt the proof toward the mouse, with a glare that follows it.
    const el = frame.current;
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--tilt-x', `${((px - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${((0.5 - py) * 6).toFixed(2)}deg`);
    el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
  };
  const endDrag = () => {
    drag.current = null;
    frame.current?.classList.remove('is-dragging');
  };
  const onPointerLeave = () => {
    const el = frame.current;
    if (!el) return;
    ['--tilt-x', '--tilt-y'].forEach((v) => el.style.setProperty(v, '0deg'));
  };

  const shownRot = turnable ? rot : 0;
  const setRefs = (node) => {
    frame.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <>
      <CropFrame
        as="figure"
        ref={setRefs}
        className={`studio__proof studio__proof--${item.id} is-${stage} ${turnable ? 'is-turnable' : ''}`}
        style={{ '--print': ink.color }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <svg
          ref={svg}
          viewBox="0 0 480 360"
          role="img"
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <Defs />
          {stage === 'printing' && <RevealClip area={item.area} />}
          <Mockup item={item} color={color} rot={shownRot} overlay={stage === 'printing' ? <Roller area={item.area} /> : null}>
            {stage === 'sketch' ? (
              <g className={color.dark ? 'is-dark' : ''}>
                <rect
                  className="art__area"
                  x={item.area.x - item.area.w / 2 - 10}
                  y={item.area.y - item.area.h / 2 - 8}
                  width={item.area.w + 20}
                  height={item.area.h + 16}
                  rx="6"
                />
                <g key={drawKey}>
                  <Artwork {...art} sketch />
                </g>
              </g>
            ) : (
              <g className={keyline ? 'art-keyline' : ''}>
                {stage === 'printing' &&
                  PLATES.map((p) => (
                    <g key={p} className={`plate-run plate-run--${p}`}>
                      <Artwork {...art} showLogo={false} />
                    </g>
                  ))}
                <g className="plate-run plate-run--final" clipPath={stage === 'printing' ? 'url(#st-reveal)' : undefined}>
                  <Artwork {...art} rot={shownRot} />
                </g>
              </g>
            )}
          </Mockup>
        </svg>
        <figcaption className="studio__caption">
          <span className="hand">{stage === 'sketch' ? 'your idea, in pencil' : stage === 'printing' ? 'on the press…' : 'the real thing'}</span>
        </figcaption>
        {stage === 'printed' && (
          <span className="studio__stamp" aria-hidden="true">
            <span>Printed</span>
            <small>Guhit Arts Center</small>
          </span>
        )}
        <span className="studio__glare" aria-hidden="true" />
      </CropFrame>

      {turnable && (
        <label className="studio__turn">
          <span className="hand">drag the mug, or slide, to turn it</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={toDegrees(rot)}
            onChange={(e) => {
              setTurned(true);
              setRot((Number(e.target.value) * Math.PI) / 180);
            }}
            aria-label="Turn the mug"
          />
        </label>
      )}
      {stage === 'printed' && prints > 0 && <Confetti count={42} />}
    </>
  );
});

export default ProofStage;
