import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// A dialog using the design system's .ud-dialog: closes on Escape or a click outside, focus moves into it and returns on close.
const Modal = ({ title, onClose, children, actions, destructive = false }) => {
  const { dir } = useLanguage();
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('select, input, textarea, button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('a[href], button:not([disabled]), select, input, textarea');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && previous.focus) previous.focus();
    };
  }, [onClose]);

  return (
    <div className="ud-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="ud-dialog ud-root" role={destructive ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={title} dir={dir}>
        <h3>{title}</h3>
        {children}
        <div className="ud-dialog-actions">{actions}</div>
      </div>
    </div>
  );
};

export default Modal;
