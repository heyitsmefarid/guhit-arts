import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Accessible dialog built on <dialog>: focus is trapped, Escape closes it.
export default function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="modal__box">
        <header className="modal__head">
          <h2 id="modal-title" className="h3">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </dialog>
  );
}
